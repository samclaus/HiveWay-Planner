import { removeFirstOccurrence } from "../lib/array-util";
import { reuseInflight, reuseInflightKeyed } from "../lib/async-util";
import { doNothing } from "../lib/do-nothing";
import type { RxAbstractCache as AbstractCache, RxCacheItemStatus as ItemStatus, RxCacheStatusCallback as StatusCallback } from "./_cache";
import { RxRemoteSet as RemoteSet, RxMutableSetStatus, type RxRemoteSetStatus } from "./_remote-set";
import { RxSetEvent as SetEvent, type RxSetDataCallback as SetDataCallback, type RxSetEventInfo as SetEventInfo } from "./_set";
import { removeUniqueID, replaceUniqueID, type RxHasID as HasID, type RxUnsubscribeFn as UnsubscribeFn } from "./_util";
import { RxMutableValue, type RxValueWithSnapshot } from "./_value";

/**
 * Woowwww look at me I can use math terminology aren't I cool? This is
 * a convenience/performance class which combines a reactive cache
 * (maps IDs to items, good for watching one item) and a reactive set
 * (good for observing an array of items) into one object.
 * 
 * This class is good for anywhere where you either have the full collection
 * of items loaded, or none at all. They should probably also have uniform
 * properties so you don't have to do any hacky workarounds to abuse this
 * class.
 */
export class RxUniversalSet<Item extends HasID, RefreshError = unknown>
    implements AbstractCache<Item>, RemoteSet<Item, RefreshError> {

    /**
     * Refresh the cache. If a max age for cached data is not provided,
     * the default for THIS cache (from constructor) will be used. If
     * a data request is already in-flight, the pending promise will be
     * returned, meaning it is safe to spam call this function without
     * generating tons of, say, backend requests. Whenever the user
     * explicitly presses refresh, ALL pertinent caches should be
     * refreshed with a max age of ZERO.
     */
    readonly forceRefresh: () => Promise<readonly Item[]>;
    readonly status$: RxValueWithSnapshot<RxRemoteSetStatus<RefreshError>>;

    private readonly itemsByID = new Map<string, Item>();
    private readonly watchers: [string, StatusCallback<Item>][] = [];
    private readonly deletedByUs = new Map<string, [number, Item]>();
    private readonly refreshing = new Set<string>();

    protected items: Item[] = [];
    
    private setSubscriptions: SetDataCallback<Item>[] = [];
    private nextAutorefreshHandle?: number;

    lastRefreshed = 0;

    /**
     * Refresh an item. Even if successful, may resolve with undefined if the
     * item no longer exists, or we don't have access to it in the backend,
     * etc. Will automatically place the item in the cache and notify all
     * watchers before resolving (when successful).
     */
    readonly refresh: (id: string) => Promise<Item | undefined>;

    readonly index: ReadonlyMap<string, Item> = this.itemsByID;

    constructor(
        fetchLatestItems: () => Promise<Item[]>,
        fetchItemByID: (id: string) => Promise<Item | undefined>,

        /**
         * The max age before which data should be refreshed automatically
         * as long as it is being consumed.
         */
        private readonly maxAgeMillis: number,
    ) {
        this.refresh = reuseInflightKeyed(async (id: string): Promise<Item | undefined> => {
            const item = await fetchItemByID(id);

            // Item might be undefined if the item no longer exists
            if (item) {
                this.$set(item);
            }

            return item;
        });
        const status = new RxMutableSetStatus<RefreshError>();
        const status$ = new RxMutableValue(status);

        // NOTE: the 'status$' variable here in the constructor is mutable, but the 'status$' property
        // on the class is declared with a read-only reactive interface
        this.status$ = status$;
        this.forceRefresh = reuseInflight(async (): Promise<readonly Item[]> => {
            this.stopAutorefreshCountdown();

            status.refreshing = true;
            status$.emit();

            try {
                const latestItems = await fetchLatestItems();
                const { itemsByID } = this;

                itemsByID.clear();

                for (const item of latestItems) {
                    itemsByID.set(item.id, item);
                }

                this.items = latestItems;
                this.lastRefreshed = Date.now();

                // NOTE: set the 'refreshError' property but do NOT emit(), because we will emit
                // in the 'finally' clause below, which is also where we will set 'refreshing'
                // back to false
                status.refreshError = undefined;

                for (const [watchedID, callback] of this.watchers) {
                    const info = itemsByID.get(watchedID);
        
                    if (info) {
                        callback({
                            info,
                            deletedByUsAt: 0,
                            refreshing: this.refreshing.has(watchedID),
                            refreshErr: undefined,
                        });
                    } else {
                        const tombstone = this.deletedByUs.get(watchedID);
            
                        if (tombstone) {
                            const [deletedByUsAt, info] = tombstone;
            
                            callback({
                                info,
                                deletedByUsAt,
            
                                // Our refreshing semantics allow refreshing even items that are marked as deleted
                                // by us--just in case!
                                refreshing: this.refreshing.has(watchedID),
                                refreshErr: undefined,
                            });
                        } else {
                            // NOTE: if we are told to clear existing items, it means we just loaded
                            // every item in the collection and any unrecognized IDs REALLY don't
                            // exist in the backend
                            callback({
                                info: undefined,
                                deletedByUsAt: 0,
                                refreshing: false,
                                refreshErr: undefined,
                            });
                        }
                    }
                }

                this.emitEventToSubscribers({ type: SetEvent.Refresh });

                return latestItems;
            } catch (err) {
                // NOTE: set the 'refreshError' property but do NOT emit(), because we will emit
                // in the 'finally' clause below, which is also where we will set 'refreshing'
                // back to false
                status.refreshError = err as RefreshError;

                throw err; // Re-throw for propagation up the forceRefresh() promise chain
            } finally {
                // If we still have consumers, queue up the next autorefresh
                if (this.setSubscriptions.length > 0) {
                    this.nextAutorefreshHandle = window.setTimeout(
                        () => {
                            this.forceRefresh();
                        },
                        this.maxAgeMillis,
                    );
                }

                status.refreshing = false;
                status$.emit();
            }
        });
    }

    private emitEventToSubscribers(ev: SetEventInfo<Item>): void {
        for (const callback of this.setSubscriptions) {
            try {
                callback(this.items, ev);
            } catch (err) {
                console.error("Universal set subscriber threw error:", err);
            }
        }
    }

    private emitStatusToWatchers(id: string, status: ItemStatus<Item>): void {
        for (const [watchedID, callback] of this.watchers) {
            if (watchedID === id) {
                callback(status);
            }
        }
    }

    get(id: string): Item | undefined {
        return this.itemsByID.get(id);
    }

    select(ids: readonly string[]): Item[] {
        const items: Item[] = [];

        for (const id of ids) {
            const item = this.itemsByID.get(id);

            if (item) {
                items.push(item);
            }
        }

        return items;
    }

    watch(id: string, callback: StatusCallback<Item>): UnsubscribeFn {
        // Call the watcher BEFORE registering it so we don't leak memory
        // if the watcher blows up (not much gained but nothing lost by
        // writing the code this way)
        const info = this.itemsByID.get(id);

        if (info) {
            callback({
                info,
                deletedByUsAt: 0,
                refreshing: this.refreshing.has(id),
                refreshErr: undefined,
            });
        } else {
            const tombstone = this.deletedByUs.get(id);

            if (tombstone) {
                const [deletedByUsAt, info] = tombstone;

                callback({
                    info,
                    deletedByUsAt,

                    // Our refreshing semantics allow refreshing even items that are marked as deleted
                    // by us--just in case!
                    refreshing: this.refreshing.has(id),
                    refreshErr: undefined,
                });
            } else {
                // Give the watcher undefined info, and then we will start a refresh (which will reuse
                // the promise if the ID is already refreshing); we must pass "refreshing: true" because
                // the refresh code will begin running and emit a new status to all watchers BEFORE we
                // even register this callback in the watcher array below
                callback({
                    info: undefined,
                    deletedByUsAt: 0,
                    refreshing: true,
                    refreshErr: undefined,
                });

                // Now attempt to load the item and ignore any error that occurs--it will
                // be emitted to the UI in an event, if anyone is still listening and
                // therefore cares about giving error feedback
                this.refresh(id).catch(doNothing);
            }
        }

        this.watchers.push([id, callback]);

        return (): void => {
            for (let i = 0; i < this.watchers.length; ++i) {
                if (this.watchers[i]![1] === callback) {
                    this.watchers.splice(i, 1);
                    break;
                }
            }
        };
    }

    $set(item: Item): void {
        const id = item.id;
        const prev = this.itemsByID.get(id);

        this.itemsByID.set(id, item);
        this.emitStatusToWatchers(id, {
            info: item,
            deletedByUsAt: 0,
            refreshing: false,
            refreshErr: undefined,
        });

        if (prev) {
            replaceUniqueID(this.items, item);
            this.emitEventToSubscribers({ type: SetEvent.Modify, item, prev });
        } else {
            this.items.push(item);
            this.emitEventToSubscribers({ type: SetEvent.Add, item });
        }
    }

    $delete(id: string, noTombstone = false): void {
        const info = this.itemsByID.get(id);

        if (info) {
            this.itemsByID.delete(id);
            removeUniqueID(this.items, id);

            if (noTombstone) {
                this.emitStatusToWatchers(id, {
                    info: undefined,
                    deletedByUsAt: 0,
                    refreshing: false,
                    refreshErr: undefined,
                });
            } else {
                const deletedByUsAt = Date.now();
    
                this.deletedByUs.set(id, [deletedByUsAt, info]);
                this.emitStatusToWatchers(id, {
                    info,
                    deletedByUsAt,
                    refreshing: false,
                    refreshErr: undefined,
                });
            }

            this.emitEventToSubscribers({ type: SetEvent.Delete, item: info });
        }
    }
 
    /**
     * Register a callback for data changes. If data is already present,
     * the callback will be called immediately.
     */
    subscribe(callback: SetDataCallback<Item>): UnsubscribeFn {
        this.setSubscriptions.push(callback);

        if (this.lastRefreshed > 0) {
            callback(this.items, { type: SetEvent.Refresh });
        }
        if ((Date.now() - this.lastRefreshed) > this.maxAgeMillis) {
            // Whenever the refresh function completes, it will set a timeout
            // to automatically perform the next refresh if there are still
            // consumers.
            this.forceRefresh();
        }

        return (): void => {
            removeFirstOccurrence(this.setSubscriptions, callback);

            // No one is listening, so stop the next autorefresh (if we are not in
            // the middle of a refresh) from happening
            if (this.setSubscriptions.length === 0) {
                this.stopAutorefreshCountdown();
            }
        };
    };

    /**
     * Determines if an item exists in the list.
     */
    has(id: string): boolean {
        return this.itemsByID.has(id);
    }

    /**
     * TODO: need a way to clear the list and completely abort any pending refresh operation
     * (meaning it doesn't even update the refreshing$ variable, etc.) so that we can safely
     * log out without reloading the page by just having services clear their state and empty
     * out subscriptions whenever the session is logged out completely (not just locked).
     */
    todoResetMethodForLogout(): void {
        throw new Error("not implemented");
    }

    private stopAutorefreshCountdown(): void {
        if (typeof this.nextAutorefreshHandle === "number") {
            window.clearTimeout(this.nextAutorefreshHandle);
            this.nextAutorefreshHandle = undefined;
        }
    }

}