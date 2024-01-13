import { RxSet, RxSetEvent, type RxSetDataCallback } from "./_set";
import { removeUniqueID, replaceUniqueID, type RxHasID, type RxUnsubscribeFn } from "./_util";

/**
 * Map a reactive set through a transformer function, similar to Array#map(). It is important that the
 * transformer function be pure in the sense it doesn't rely on any state other than the item given to
 * it because that state will not magically be taken into account when propagating changes throughout
 * the UI, hence the very explicit name of this function.
 */
export function statelessTransform<Item extends RxHasID, Transformed extends RxHasID>(
    parent: RxSet<Item>,
    pureTransformer: (item: Item) => Transformed,

    /**
     * In case the transformer manipulates IDs of items (not just other properties), the transformer
     * is called by default when an item is deleted from the source set so we know which ID to delete
     * from the transformed set. If a lot of deletions are frequent and/or the transformer function is
     * slow, you may want to explicitly specify how the transformer gets an ID in the new set from an
     * item in the source set without doing the work of transforming everything else.
     * 
     * A concrete example of this scenario is mapping the set of members of a single team. Every team
     * member info has an ID composed of the team+user IDs to uniquely identify it SYSTEM-WIDE, but if
     * you know you are mapping a set of team members from exactly one team, the mapped items may use
     * the user ID as the primary ID in the mapped set, especially to facilitate abstractions for aggregating
     * information from the set of known users. pureTranform() has to anticipate this sort of behavior,
     * and this callback is an optimization "escape hatch" if the default/safe route is a bottleneck.
     */
    idTransformer: (item: Item) => string = item => pureTransformer(item).id,
): RxSet<Transformed> {
    const listeners: RxSetDataCallback<Transformed>[] = [];

    let unsubscribeFromSuperset: RxUnsubscribeFn | undefined;
    let transformed: Transformed[] = [];

    return {
        subscribe(cb) {
            listeners.push(cb);

            if (unsubscribeFromSuperset) {
                cb(transformed, { type: RxSetEvent.Refresh });
            } else {
                unsubscribeFromSuperset = parent.subscribe(
                    (items, ev) => {
                        switch (ev.type) {
                            case RxSetEvent.Add: {
                                const item = pureTransformer(ev.item);

                                transformed.push(item);

                                for (const cb of listeners) {
                                    cb(transformed, { type: RxSetEvent.Add, item });
                                }

                                break;
                            }

                            case RxSetEvent.Delete: {
                                const idToRemove = idTransformer(ev.item);
                                const item = removeUniqueID(transformed, idToRemove);

                                if (item) {
                                    for (const cb of listeners) {
                                        cb(transformed, { type: RxSetEvent.Delete, item });
                                    }
                                } else {
                                    console.error(
                                        "[statelessTransform]: got delete event (logged after " +
                                        `this message) and transformed its ID to "${idToRemove}", ` +
                                        "but no item was found with the transformed ID:", ev,
                                    );
                                }

                                break;
                            }

                            case RxSetEvent.Modify: {
                                const idToReplace = idTransformer(ev.prev);
                                const item = pureTransformer(ev.item);
                                const prev = replaceUniqueID(transformed, item, idToReplace);

                                if (prev) {
                                    for (const cb of listeners) {
                                        cb(transformed, { type: RxSetEvent.Modify, item, prev });
                                    }
                                } else {
                                    console.error(
                                        "[statelessTransform]: got modify event (logged after " +
                                        "this message) and transformed the previous version's " +
                                        `ID to "${idToReplace}", but no item was found with ` +
                                        "that ID in the array to replace:", ev,
                                    );
                                }

                                break;
                            }

                            case RxSetEvent.Refresh: {
                                transformed = items.map(pureTransformer);
                                
                                for (const cb of listeners) {
                                    cb(transformed, { type: RxSetEvent.Refresh });
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
                }
            };
        },
    };
}