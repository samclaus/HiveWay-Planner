import { Deferred, reuseInflightKeyed } from "../async-util";
import { doNothing } from "../do-nothing";
import type { RxHasID, RxUnsubscribeFn } from "./_util";

interface ItemStatus<T> {
    info: T | undefined;
    deletedByUsAt: number;
    refreshing: boolean;
    refreshErr: unknown;
};

type Callback<T> = (ev: ItemStatus<T>) => void;
type GlobalCallback<T> = (id: string, ev: ItemStatus<T>) => void;

interface AbstractCache<Item extends RxHasID> {
    readonly index: ReadonlyMap<string, Item>;

    /**
     * Begin observing a single item. The provided watcher might
     * not be called synchronously by the implementation.
     */
    watch(id: string, callback: Callback<Item>): RxUnsubscribeFn;

    /**
     * Synchronously look up an item by ID. Will return undefined if
     * the item is unrecognized, even if it was deleted by us during
     * this session.
     */
    get(id: string): Item | undefined;

    /**
     * Returns true if an item is present with the given ID, false otherwise.
     */
    has(id: string): boolean;

    /**
     * Effectively pipes the array of IDs through get() and filters out
     * unrecognized/deleted items.
     */
    select(ids: readonly string[]): Item[];

    refresh(id: string): Promise<Item | undefined>;
}

abstract class AutofetchingCache<Item extends RxHasID> implements AbstractCache<Item> {

    /**
     * Refresh an item. Even if successful, may resolve with undefined if the
     * item no longer exists, or we don't have access to it in the backend,
     * etc. Will automatically place the item in the cache and notify all
     * watchers before resolving (when successful).
     */
    readonly refresh: (id: string) => Promise<Item | undefined>;

    private readonly itemsByID = new Map<string, Item>();
    private readonly watchers: [string, Callback<Item>][] = [];
    private readonly globalWatchers: GlobalCallback<Item>[] = [];
    private readonly deletedByUs = new Map<string, [number, Item]>();
    private readonly refreshing = new Set<string>();

    readonly index: ReadonlyMap<string, Item> = this.itemsByID;

    constructor(
        fetchItemByID: (id: string) => Promise<Item | undefined>,
    ) {
        this.refresh = reuseInflightKeyed(async (idToRefresh: string): Promise<Item | undefined> => {
            const tombstone = this.deletedByUs.get(idToRefresh);
            const [deletedByUsAt, currentInfoIfAny] = tombstone
                ? tombstone
                : [0, this.itemsByID.get(idToRefresh)];

            this.refreshing.add(idToRefresh);
            this.emitStatusToWatchers(idToRefresh, {
                info: currentInfoIfAny,
                deletedByUsAt,
                refreshing: true,
                refreshErr: undefined,
            });

            // Look up the latest information for the item, which might be nonexistent (undefined)
            const item = await fetchItemByID(idToRefresh).catch(
                refreshErr => {
                    // Before blowing up the overall refresh function, we need to emit an event to tell all
                    // of the watchers that we failed to refresh
                    this.emitStatusToWatchers(idToRefresh, {
                        info: currentInfoIfAny,
                        deletedByUsAt,
                        refreshing: false,
                        refreshErr,
                    });

                    // NOW we can re-throw the error
                    throw refreshErr;
                },
            ).finally(
                () => {
                    this.refreshing.delete(idToRefresh);
                },
            );

            if (item) {
                // If we successfully looked up the item from the server, we can replace the current
                // information in the map and emit a fresh info event to all watchers
                this.$set(item);
            } else {
                // Even if we didn't get new info, mark the item as no longer refreshing
                this.emitStatusToWatchers(idToRefresh, {
                    info: currentInfoIfAny,
                    deletedByUsAt,
                    refreshing: false,
                    refreshErr: undefined,
                });
            }

            // Now return the latest info (or lack of) that came from the server to the caller
            return item;
        });
    }

    /**
     * This hook gives each cache implementation the chance to do type-specific
     * behavior like deciding which sets an item should belong in (maybe even
     * removing it from some sets if it no longer belongs, like when a VM becomes
     * inactive) BEFORE watchers are notified of the new/updated item.
     */
    protected abstract afterItemSetBeforeWatchers(item: Item): void;

    private emitStatusToWatchers(id: string, status: ItemStatus<Item>): void {
        for(const cb of this.globalWatchers) {
            cb(id, status);
        }

        for (const [watchedID, callback] of this.watchers) {
            if (watchedID === id) {
                try {
                    callback(status);
                } catch (err) {
                    console.error(`Watcher for ID [${id}] threw error:`, err);
                }
            }
        }
    }

    get(id: string): Item | undefined {
        return this.itemsByID.get(id);
    }

    has(id: string): boolean {
        return this.itemsByID.has(id);
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

    /**
     * Add a watch for the entire set of items. The callbacks get called irespective of the ID of the item
     * and they are passed the item as the first argument. The event is the second argument
     * This method is not part of the abstract interface since it is only useful in select circumstances
     * @param callback Function to call on any change
     * @returns 
     */
    watchGlobal(callback: GlobalCallback<Item>): RxUnsubscribeFn {        
        this.globalWatchers.push(callback);

        return (): void => {
            for (let i = 0; i < this.globalWatchers.length; ++i) {
                if (this.globalWatchers[i] === callback) {
                    this.globalWatchers.splice(i, 1);
                    break;
                }
            }
        };
    }

    watch(id: string, callback: Callback<Item>): RxUnsubscribeFn {
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
                if (this.watchers[i][1] === callback) {
                    this.watchers.splice(i, 1);
                    break;
                }
            }
        };
    }

    protected pollUntil(
        id: string,
        predicate: (item: Item | undefined) => boolean,
        pollIntervalMS: number,
        abortSig: AbortSignal,
        abortErr: Error,
    ): Promise<Item> {
        const d = new Deferred<Item>();

        let done = false;
        let nextPollTimeout = -1;
        let unsubFromID: RxUnsubscribeFn;

        function cleanup(): void {
            done = true;
            window.clearTimeout(nextPollTimeout);
            abortSig.removeEventListener("abort", onAbort);

            // Cleanup may be done immediately before the this.watch()
            // call even finishes returning an unsubscribe callback so
            // we must wrap the unsubscribe in set timeout + closure
            window.setTimeout(() => unsubFromID());
        }

        function onAbort(): void {
            cleanup();
            d.reject(abortErr);
        }

        abortSig.addEventListener("abort", onAbort);

        function propagateError(err: unknown): void {
            if (!done) {
                d.reject(err);
                done = true;
                abortSig.removeEventListener("abort", onAbort);
                unsubFromID();
            }
        }

        function checkPredicate(item: Item | undefined): void {
            if (!done) {
                try {
                    if (predicate(item)) {
                        cleanup();
                        d.resolve(item);
                    } else {
                        // TODO: keep polling
                    }
                } catch (err) {
                    propagateError(err);
                }
            }
        }

        unsubFromID = this.watch(id, ({ info, deletedByUsAt, refreshing, refreshErr }) => {
            // TODO: polling code should probably be told whether we deleted
            // the item for better user feedback (e.g., the VM finally launches
            // and starts attaching drives but you just deleted one of the
            // drives)
            if (!refreshing) {
                checkPredicate(deletedByUsAt ? undefined : info);
            }
        });

        const poll = (): void => {
            this.refresh(id).then(
                () => {
                    if (!done) {
                        nextPollTimeout = window.setTimeout(poll, pollIntervalMS);
                    }
                },
                propagateError,
            );
        };

        // Start polling immediately
        poll();

        return d.promise;
    }

    protected $set(item: Item): void {
        this.itemsByID.set(item.id, item);
        this.afterItemSetBeforeWatchers(item);
        this.emitStatusToWatchers(item.id, {
            info: item,
            deletedByUsAt: 0,
            refreshing: false,
            refreshErr: undefined,
        });
    }

    protected $freshen(items: readonly Item[], clearExisting = false): Set<string> {
        const { itemsByID } = this;

        if (clearExisting) {
            itemsByID.clear();
        }

        const idsReplaced = new Set<string>();

        for (const item of items) {
            itemsByID.set(item.id, item);
            idsReplaced.add(item.id);
        }

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

        return idsReplaced;
    }

    protected $delete(id: string, noTombstone = false): void {
        const info = this.itemsByID.get(id);

        if (info) {
            this.itemsByID.delete(id);

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
        }
    }

}

export type {
    ItemStatus as RxCacheItemStatus,
    Callback as RxCacheStatusCallback,
    AbstractCache as RxAbstractCache,
    AutofetchingCache as RxAutofetchingCache,
};

/**
 * Utility class for switching between different IDs we want to watch.
 *
 * Created to make item details less annoying because they all receive
 * the item ID via a binding that can change (need to watch a different
 * ID from before but the whole rendering pipeline is still the same).
 */
export class RxCacheRewatcher<Item extends RxHasID> {

    private unsubscribeFromCurrent: RxUnsubscribeFn = doNothing;

    constructor(
        private readonly cache: AbstractCache<Item>,
        private readonly callback: Callback<Item>,
    ) { }

    switchTo(id: string): void {
        this.unsubscribeFromCurrent();
        this.unsubscribeFromCurrent = this.cache.watch(id, this.callback);
    }

    stopWatching(): void {
        this.unsubscribeFromCurrent();
        this.unsubscribeFromCurrent = doNothing;
    }

}
