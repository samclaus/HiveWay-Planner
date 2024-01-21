import { doNothing } from "../lib/do-nothing";
import { RxSet, RxSetEvent, type RxSetDataCallback } from "./_set";
import { removeUniqueID, replaceUniqueID, type RxHasID, type RxUnsubscribeFn } from "./_util";

export interface RxStatelessSearchOpts<T> {
    /**
     * The set to search.
     */
    set: RxSet<T>;
    /**
     * The predicate used to search an item.
     */
    predicate: (item: T, query: string) => boolean;
    /**
     * If true, the query will always be lowercased before being passed to the predicate.
     */
    caseInsensitive: boolean;

    /**
     * Optional callback for inspecting events from the underlying set
     * before they are filtered by the searcher.
     */
    preFilterHook?: RxSetDataCallback<T>;
}

export interface RxStatelessSearchHandle<Item extends RxHasID> extends RxSet<Item> {
    updateQuery(query: string): void;
}

/**
 * A fixed reactive subset begins life with the provided members and reactively updates them as they are updated
 * in the superset. If any of the members are deleted from the superset, they will be deleted from this subset,
 * meaning the subset CAN SHRINK but will NEVER GROW.
 * 
 * The main purpose of this is for prefilling inputs with
 * user/team/whatever sets from a previous selection, like when clicking the context menu for a user and to add
 * them to a team. Your intent is to add THAT user to a team, so if the user gets deleted from cache, either
 * because an in-progress frontend task deleted it or a "user does not exist" error was received from an arbitrary
 * request, they should be removed from the selection. If the preset selection reaches size zero, it means your
 * previous intent is no longer valid and whatever you were doing (in the previous example, filling out a form
 * modal to add the user to a team) should be aborted with error feedback.
 * 
 * @todo if we decouple reactive lists from ID->item maps (basically reactive key-value caches), function
 * should just take a global key-value cache of ALL known items from anywhere. 
 */
export function rxStatelessSearch<Item extends RxHasID>(opts: RxStatelessSearchOpts<Item>): RxStatelessSearchHandle<Item> {
    const { set, predicate, caseInsensitive, preFilterHook = doNothing } = opts;
    const listeners: RxSetDataCallback<Item>[] = [];

    let unsubscribeFromSuperset: RxUnsubscribeFn | undefined;
    let query = "";
    let unfiltered: readonly Item[] = [];
    let filtered: Item[] = [];

    return {
        updateQuery(newQuery: string): void {
            if (caseInsensitive) {
                newQuery = newQuery.toLowerCase();
            }
            
            const toSearch = newQuery.startsWith(query)
                ? filtered
                : unfiltered;

            query = newQuery;
            filtered = [];

            for (const item of toSearch) {
                if (predicate(item, query)) {
                    filtered.push(item);
                }
            }
            
            for (const cb of listeners) {
                cb(filtered, { type: RxSetEvent.Refresh });
            }
        },
        subscribe(cb) {
            listeners.push(cb);

            if (unsubscribeFromSuperset) {
                cb(filtered, { type: RxSetEvent.Refresh });
            } else {
                unsubscribeFromSuperset = set.subscribe(
                    (items, ev) => {
                        unfiltered = items;

                        preFilterHook(items, ev);

                        switch (ev.type) {
                            case RxSetEvent.Add: {
                                const { item } = ev;

                                if (predicate(item, query)) {
                                    filtered.push(item);

                                    for (const cb of listeners) {
                                        cb(filtered, ev);
                                    }
                                }

                                break;
                            }

                            case RxSetEvent.Delete: {
                                const { item } = ev;

                                if (predicate(item, query)) {
                                    removeUniqueID(filtered, item.id);

                                    for (const cb of listeners) {
                                        cb(filtered, ev);
                                    }
                                }
                                break;
                            }

                            case RxSetEvent.Modify: {
                                const { item, prev } = ev;
                                const usedToMatch = predicate(prev, query);
                                const matchesNow = predicate(item, query);

                                if (usedToMatch && matchesNow) {
                                    // Item matched the filter before and STILL matches, so fire
                                    // a "modify" event
                                    replaceUniqueID(filtered, item);

                                    for (const cb of listeners) {
                                        cb(filtered, ev);
                                    }
                                } else if (usedToMatch) {
                                    // Effectively a "delete" (the old version) operation for us
                                    removeUniqueID(filtered, prev.id);

                                    for (const cb of listeners) {
                                        cb(filtered, { type: RxSetEvent.Delete, item: prev });
                                    }
                                } else if (matchesNow) {
                                    // Effectively an "add" operation for us
                                    filtered.push(item);

                                    for (const cb of listeners) {
                                        cb(filtered, { type: RxSetEvent.Add, item });
                                    }
                                }
                                // Else: item didn't match before and STILL doesn't match so
                                // basically just ignore it and don't pass it down the line
                                break;
                            }

                            case RxSetEvent.Refresh: {
                                filtered = [];

                                for (const item of items) {
                                    if (predicate(item, query)) {
                                        filtered.push(item);
                                    }
                                }
                                
                                for (const cb of listeners) {
                                    cb(filtered, { type: RxSetEvent.Refresh });
                                }

                                break;
                            }
                        }
                    }
                );
            }

            // Unsubcribe callback; if we no longer have any subscribers we should
            // unsubscribe from our underlying data source until we get a subscriber
            // again
            return function () {
                for (let i = 0; i < listeners.length; ++i) {
                    if (listeners[i] === cb) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
                if (listeners.length === 0 && unsubscribeFromSuperset) {
                    unsubscribeFromSuperset();
                    unsubscribeFromSuperset = undefined;
                    unfiltered = [];
                    filtered = [];
                }
            };
        },
    }
}