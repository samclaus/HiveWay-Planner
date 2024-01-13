import { RxSet as Set, RxSetEvent as SetEvent, type RxSetDataCallback as SetDataCallback } from "./_set";
import { removeUniqueID, replaceUniqueID, type RxHasID as HasID, type RxUnsubscribeFn as UnsubscribeFn } from "./_util";

/**
 * This is a base class for easily creating higher-order reactive sets. It handles managing the
 * array of subscriptions and will notify the subclass when it is time to set up and tear down
 * internal subscriptions, as well as providing some safe/convenient methods for mutating the
 * set and emitting events to subscribers.
 */
export abstract class RxSetBase<Item extends HasID> implements Set<Item> {

    private readonly subscribers: SetDataCallback<Item>[] = [];

    private items: Item[] = [];

    /**
     * This method will be called whenever the set changes from having no subscribers
     * to having 1 subscriber, meaning it is now "active". This is when internal
     * subscriptions should be set up. Receiving more concurrent subscribers beyond
     * the first is not treated as a different state and this method will not be called
     * when moving from 1 to 2 or 2 to 3 subscribers, and vice versa. The set will
     * always either be "active" (1 or more subscribers) or "inactive" (no subscribers).
     */
    protected abstract beginEmitting(): void;

    /**
     * This method will be called when the set changes from having 1 subscriber to having
     * no subscribers, and is an opportunity to clean up internal subscriptions as the set
     * moves to an inactive state (reactive sets should be lazy and not do any work unless
     * they are subscriber to). See the comment for beginEmitting() for more information.
     */
    protected abstract stopEmitting(): void;

    protected publish(items: Item[]): void {
        this.items = items;

        for (const callback of this.subscribers) {
            callback(items, { type: SetEvent.Refresh });
        }
    }

    protected add(item: Item): void {
        this.items.push(item);

        for (const callback of this.subscribers) {
            callback(this.items, { type: SetEvent.Add, item });
        }
    }

    protected update(item: Item): void {
        const prev = replaceUniqueID(this.items, item);

        if (prev) {
            for (const callback of this.subscribers) {
                callback(this.items, { type: SetEvent.Modify, item, prev });
            }
        } else {
            console.warn(
                "RxSetBase subclass tried to update an item which does not currently exist " +
                `in the set (item ID is "${item.id}"). Item will instead be added to the ` +
                "set and a 'create' event will be emitted instead of a 'modify' event.",
            );
            this.add(item);
        }
    }

    protected delete(id: string): void {
        const item = removeUniqueID(this.items, id);

        if (item) {
            for (const callback of this.subscribers) {
                callback(this.items, { type: SetEvent.Delete, item });
            }
        } else {
            console.warn(
                "RxSetBase subclass tried to delete an item which does not currently exist " +
                `in the set (item ID is "${id}"). No event will be emitted to subscribers.`,
            );
        }
    }

    subscribe(callback: SetDataCallback<Item>): UnsubscribeFn {
        this.subscribers.push(callback);

        if (this.subscribers.length === 1) {
            this.beginEmitting();
        }

        return (): void => {
            const index = this.subscribers.indexOf(callback);

            if (index >= 0) {
                this.subscribers.splice(index, 1);

                if (this.subscribers.length === 0) {
                    this.stopEmitting();
                }
            }
        }
    }

}