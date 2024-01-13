import { reuseInflight } from "../async-util";
import { doNothing } from "../do-nothing";
import { RxSet, RxSetEvent, type RxSetDataCallback } from "./_set";
import { removeUniqueID, replaceUniqueID, type RxHasID, type RxUnsubscribeFn } from "./_util";
import { RxFinalValue, RxMutableValue, type RxValueWithSnapshot } from "./_value";

const RESOLVED_PROMISE_WITH_EMPTY_ARRAY = Promise.resolve<readonly []>([]);

export interface RxRemoteSetStatus<RefreshError> {
    /**
     * The current state of the set. Set implementations will generally
     * refresh themselves automatically, so it critical for the UI to
     * have a standard way to react and show a refreshing indicator no
     * matter where the set was refreshed FROM, be it automatic or the
     * user clicking something that triggered a refresh, etc.
     */
    readonly refreshing: boolean;

     /**
      * Error the most recent refresh attempt failed with. Will be undefined
      * if the most recent refresh succeeded or if the set has never been
      * refreshed.
      */
    readonly refreshError: RefreshError | undefined;
}

export interface RxRemoteSet<Item extends RxHasID, RefreshError> extends RxSet<Item> {
    /**
     * UNIX millisecond timestamp when the sets information was last refreshed.
     * Will be 0 if information was never loaded.
     */
    readonly lastRefreshed: number;

    readonly status$: RxValueWithSnapshot<RxRemoteSetStatus<RefreshError>>;

    /**
     * Force the set to begin refreshing itself immediately.
     * 
     * This should typically only be called when the user clicks a refresh
     * buttons. Remote set implementations should generally have a default
     * max age per instance and automatically refresh themselves at an
     * optimized interval as long as they have consumers.
     * 
     * The return promise will resolve with the latest array of items if
     * the refresh is successful.
     */
    forceRefresh(): Promise<readonly Item[]>;

    /**
     * Check if this set CURRENTLY contains an item with the given ID.
     */
    has(id: string): boolean;
}

export class RxMutableSetStatus<RefreshError> implements RxRemoteSetStatus<RefreshError> {

    refreshing = false;
    refreshError: RefreshError | undefined = undefined;

}

export namespace RxRemoteSet {
    /**
     * Just an empty set to use as a placeholder anywhere a real reactive
     * set is not available yet, because, say, you need to load asynchronous
     * information before you can properly filter out a data source like users
     * or VM images.
     */
    export const EMPTY: RxRemoteSet<any, undefined> = {
        subscribe(callback: RxSetDataCallback<any>): RxUnsubscribeFn {
            callback([], { type: RxSetEvent.Refresh });
            return doNothing;
        },
        lastRefreshed: Infinity,
        status$: new RxFinalValue(new RxMutableSetStatus<undefined>()),
        forceRefresh(): Promise<readonly any[]> {
            return RESOLVED_PROMISE_WITH_EMPTY_ARRAY;
        },
        has(id: string): boolean {
            return false;
        },
    };
}

/**
 * Bread-and-butter remote set implementation which will autorefresh at a fixed interval as long as it has
 * consumers.
 * 
 * The type of this class is considered to be a "mutable" handle and should be protected as private state
 * in most services, while exposing another reference to the same runtime object but duct-typed as a
 * simple remote set (immutable, used by consumers of the state).
 * 
 * This implementation will NOT give a consumer data immediately if it was not refreshed at least once
 * before the consumer subscribed (but it would immediately attempt to refresh so it can give information
 * to the consumer ASAP).
 */
export class RxAutorefreshingRemoteSet<Item extends RxHasID, RefreshError = unknown> implements RxRemoteSet<Item, RefreshError>  {

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

    private readonly ids = new Set<string>();

    private items: Item[] = [];
    private subscriptions: RxSetDataCallback<Item>[] = [];
    private nextAutorefreshHandle?: number;

    lastRefreshed = 0;

    constructor(
        fetchLatestItems: () => Promise<Item[]>,

        /**
         * The max age before which data should be refreshed automatically
         * as long as it is being consumed.
         */
        private readonly maxAgeMillis: number,
    ) {
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

                const { ids } = this;

                ids.clear();

                for (const { id } of latestItems) {
                    ids.add(id);
                }

                this.items = latestItems;
                this.lastRefreshed = Date.now();
                this.fireRefreshEventToConsumers();

                // NOTE: set the 'refreshError' property but do NOT emit(), because we will emit
                // in the 'finally' clause below, which is also where we will set 'refreshing'
                // back to false
                status.refreshError = undefined;

                return latestItems;
            } catch (err) {
                // NOTE: set the 'refreshError' property but do NOT emit(), because we will emit
                // in the 'finally' clause below, which is also where we will set 'refreshing'
                // back to false
                status.refreshError = err as RefreshError;

                throw err; // Re-throw for propagation up the forceRefresh() promise chain
            } finally {
                // If we still have consumers, queue up the next autorefresh
                if (this.subscriptions.length > 0) {
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

    private stopAutorefreshCountdown(): void {
        if (typeof this.nextAutorefreshHandle === "number") {
            window.clearTimeout(this.nextAutorefreshHandle);
            this.nextAutorefreshHandle = undefined;
        }
    }

    /**
     * Register a callback for data changes. If data is already present,
     * the callback will be called immediately.
     */
    subscribe(callback: RxSetDataCallback<Item>): RxUnsubscribeFn {
        this.subscriptions.push(callback);

        if (this.lastRefreshed > 0) {
            callback(this.items, { type: RxSetEvent.Refresh });
        }
        if ((Date.now() - this.lastRefreshed) > this.maxAgeMillis) {
            // Whenever the refresh function completes, it will set a timeout
            // to automatically perform the next refresh if there are still
            // consumers.
            this.forceRefresh();
        }

        return (): void => {
            const { subscriptions } = this;

            for (let i = subscriptions.length - 1; i >= 0; --i) {
                if (subscriptions[i] === callback) {
                    subscriptions.splice(i, 1);
                    break;
                }
            }

            // No one is listening, so stop the next autorefresh (if we are not in
            // the middle of a refresh) from happening
            if (this.subscriptions.length === 0) {
                this.stopAutorefreshCountdown();
            }
        };
    };

    /**
     * Determines if an item exists in the list.
     */
    has(id: string): boolean {
        return this.ids.has(id);
    }

    private fireRefreshEventToConsumers(): void {
        for (const callback of this.subscriptions) {
            callback(this.items, { type: RxSetEvent.Refresh })
        }
    }

    /**
     * Freshen the set with new items. This is NOT considered a full refresh because it
     * does not change the set of contained IDs, but it will push a refresh event to
     * every consumer because we do not want to diff the whole list and compute granular
     * updates--assume the worst case, which is that many of the items changed and now
     * have different information.
     * 
     * This is typically used to freshen a subset when a superset is refreshed from the
     * server. For example, when refreshing the list of ALL drives, we can make sure the
     * array of our OWN drives has up-to-date info for each drive ID contained in it, but
     * for all we know, drive(s) were shared or unshared from us and so the set of actual
     * IDs contained in the OWN drives set is different--we will not know until we
     * explicitly pull the list of OWN drives from the server again.
     * 
     * Any items that do not have an entry in the map provided will be deleted from this
     * set. This is because the map is considered the global set of all item we have ever
     * encountered, and a missing item means we KNOW it has been deleted in the backend.
     * Returning to the drives concrete example, when we refresh the list of ALL drives in
     * the system, we clear the main ID->info map before registering all the newly fetched
     * items and then we freshen the list of our own drives at the very end. If a drive ID
     * exists in OWN drives but not in the set of all drives which repopulated the map, we
     * can be sure that drive no longer exists in the system.
     */
    freshenAllItems(superset: ReadonlyMap<string, Item>): void {
        const { ids: ourIDs, items: ourItems } = this;

        // Iterate backwards over the array--it is usually faster for the JS runtime and
        // also we will potentially be removing items and we do not want the added
        // complexity of shifting back the current index any time we decide to remove an
        // item while iterating over the array
        for (let i = ourItems.length - 1; i >= 0; i -= 1) {
            const itemID = ourItems[i]!.id;
            const freshInfo = superset.get(itemID);

            if (freshInfo) {
                ourItems[i] = freshInfo;
            } else {
                // Item no longer exists in the superset, so remove it from this subset
                ourItems.splice(i, 1);
                ourIDs.delete(itemID);
            }
        }

        // Maybe no items actually changed, maybe most or all of them did--we have no idea
        // so just assume worst case and tell all the consumers that the entire array changed
        this.fireRefreshEventToConsumers();
    }

    setIfTrueOrRemove(item: Item, shouldBePresent: boolean): void {
        if (shouldBePresent) {
            this.freshen(item, true);
        } else {
            this.remove(item.id);
        }
    }

    freshen(item: Item, addIfNotPresent = false): void {
        const id = item.id;

        // Item is not a member of this set, there is nothing to do
        if (this.has(id)) {
            const prev = replaceUniqueID(this.items, item);

            // It SHOULD have been in the array if the ID was in the
            // set, but may as well be typesafe since the runtime
            // will inject a typecheck anyways (which would throw
            // an error)
            if (prev) {
                for (const callback of this.subscriptions) {
                    callback(this.items, {
                        type: RxSetEvent.Modify,
                        item,
                        prev,
                    });
                }
            } else {
                console.error(
                    `[RemoteSet.freshen]: set contained ID "${id}" according ` +
                    "to the ID lookup set but the array did not contain an " +
                    "item matching the ID; new item:",
                    item,
                );
            }
        } else if (addIfNotPresent) {
            this.ids.add(item.id);
            this.items.push(item);

            for (const callback of this.subscriptions) {
                callback(this.items, { type: RxSetEvent.Add, item });
            }
        }
    }

    /**
     * Remove an item from the list and notify all subscribers. Does nothing if the
     * item does not exist.
     */
    remove(id: string): void {
        if (this.ids.delete(id)) {
            const item = removeUniqueID(this.items, id);

            // It SHOULD have been in the array if the ID was in the
            // set, but may as well be typesafe since the runtime
            // will inject a typecheck anyways (which would throw
            // an error)
            if (item) {
                for (const callback of this.subscriptions) {
                    callback(this.items, { type: RxSetEvent.Delete, item });
                }
            }
        }
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

}
