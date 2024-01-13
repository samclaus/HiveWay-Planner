import type { Comparator } from "../sorting";
import { RxSet, RxSetEvent } from "./_set";
import { removeUniqueID, replaceUniqueID, RxDataCallback, type RxHasID, type RxUnsubscribeFn } from "./_util";
import type { RxValue } from "./_value";

/**
 * Sort a reactive set. The comparator must not depend on outside state, hence the name, because
 * we cannot magically track such state and re-sort. This function will turn a reactive set into
 * a simple observable of array values because add/modify events are not useful outside of the
 * context of the overall array when you want things sorted. Thus, this should be the top-most
 * layer of any reactive state, responsible for feeding an array to Angular/Svelte/whatever
 * template.
 * 
 * @todo We can definitely take more advantage of add/modify event semantics when it comes to
 * optimizing the sorting algorithm.
 */
export function rxStatelessSort<Item extends RxHasID>(set: RxSet<Item>, pureComparator: Comparator<Item>): RxValue<readonly Item[]> {
    const listeners: RxDataCallback<readonly Item[]>[] = [];

    let unsubFromSrc: RxUnsubscribeFn | undefined;
    let sorted: Item[] = [];

    return {
        subscribe(cb) {
            listeners.push(cb);

            if (unsubFromSrc) {
                cb(sorted);
            } else {
                unsubFromSrc = set.subscribe(
                    (items, ev) => {
                        switch (ev.type) {
                            case RxSetEvent.Add: {
                                const { item } = ev;

                                let i = 0;

                                // NOTE: Prefer '<=', not '<' to make sure the new item comes AFTER
                                // any existing ones that are effectively equal to it in the sort
                                // order
                                // TODO: this could definitely be more efficient if we jump around
                                while (i < sorted.length && pureComparator(sorted[i]!, item) <= 0) {
                                    ++i;
                                }

                                sorted.splice(i, 0, item);

                                break;
                            }

                            case RxSetEvent.Delete: {
                                removeUniqueID(sorted, ev.item.id);

                                break;
                            }

                            case RxSetEvent.Modify: {
                                const { item, prev } = ev;

                                replaceUniqueID(sorted, item);

                                if (pureComparator(item, prev) !== 0) {
                                    // TODO: this could definitely be more efficient
                                    // since we already know everything else is sorted
                                    // and we can position relative to the old version
                                    sorted.sort(pureComparator);
                                }

                                break;
                            }

                            case RxSetEvent.Refresh: {
                                sorted = [...items].sort(pureComparator);

                                break;
                            }
                        }

                        for (const cb of listeners) {
                            cb(sorted);
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
                if (listeners.length === 0 && unsubFromSrc) {
                    unsubFromSrc();
                    unsubFromSrc = undefined;
                }
            };
        },
    }
}