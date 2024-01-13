import { RxSet, RxSetEvent, type RxSetDataCallback } from "./_set";
import { removeUniqueID, replaceUniqueID, type RxHasID, type RxUnsubscribeFn } from "./_util";

export interface RxStatelessFilterHandle<Item extends RxHasID> extends RxSet<Item> {
    /**
     * Manually trigger a refiltering of the entire parent set. You must do this
     * whenever any outside state the predicate depends on changes, or else the
     * filtered set may fall out of sync.
     */
    refilterFromScratch(): void;
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
export function rxStatelessFilter<Item extends RxHasID>(parent: RxSet<Item>, predicate: (item: Item) => boolean): RxStatelessFilterHandle<Item> {
    const listeners: RxSetDataCallback<Item>[] = [];

    let unsubscribeFromSuperset: RxUnsubscribeFn | undefined;
    let unfiltered: readonly Item[] = [];
    let filtered: Item[] = [];

    return {
        subscribe(cb) {
            listeners.push(cb);

            if (unsubscribeFromSuperset) {
                cb(filtered, { type: RxSetEvent.Refresh });
            } else {
                unsubscribeFromSuperset = parent.subscribe(
                    (items, ev) => {
                        unfiltered = items;

                        switch (ev.type) {
                            case RxSetEvent.Add: {
                                const { item } = ev;

                                if (predicate(item)) {
                                    filtered.push(item);

                                    for (const cb of listeners) {
                                        cb(filtered, ev);
                                    }
                                }

                                break;
                            }

                            case RxSetEvent.Delete: {
                                const { item } = ev;

                                if (predicate(item)) {
                                    removeUniqueID(filtered, item.id);

                                    for (const cb of listeners) {
                                        cb(filtered, ev);
                                    }
                                }

                                break;
                            }

                            case RxSetEvent.Modify: {
                                const { item, prev } = ev;
                                const usedToMatch = predicate(prev);
                                const matchesNow = predicate(item);

                                if (usedToMatch && matchesNow) {
                                    // Item matched the filter before and STILL matches, so
                                    // just forward the "modify" event
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
                                filtered = items.filter(predicate);
                                
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
                }
            };
        },
        refilterFromScratch(): void {
            filtered = unfiltered.filter(predicate);
                                
            for (const cb of listeners) {
                cb(filtered, { type: RxSetEvent.Refresh });
            }
        },
    };
}