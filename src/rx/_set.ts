import { doNothing } from "../lib/do-nothing";
import type { RxUnsubscribeFn } from "./_util";

/**
 * Enumeration of all event types causing a reactive set to notify subscribers.
 */
export const enum RxSetEvent {
    /**
     * Fired whenever anyone triggers a refresh of the data from the backend.
     * Only provides the entire list.
     */
    Refresh,

    /**
     * Fired whenever an item is added to the list. In addition to the new list,
     * the newly added item is provided as a third argument.
     */
    Add,

    /**
     * Fired whenever an item is removed from the list. In addition to the new list,
     * the deleted item is provided as a third argument.
     */
    Delete,

    /**
     * Fired whenever an item is removed from the list. In addition to the new list,
     * the item that was updated is provided as a third argument, and the old version
     * of the item as a fourth.
     */
    Modify,
}

/**
 * Discriminated union of all events which cause a reactive set to change.
 */
export type RxSetEventInfo<T> = {
    readonly type: RxSetEvent.Refresh;
} | {
    readonly type: RxSetEvent.Add | RxSetEvent.Delete;
    readonly item: T;
} | {
    readonly type: RxSetEvent.Modify;
    readonly item: T;
    readonly prev: T;
};

/**
 * Callback for reactive set changes. The first argument to the callback is always the
 * entire list, which means reactive sets are usable as basic reactive values, where
 * the contain data is just the entire array of items.
 */
export interface RxSetDataCallback<T> {
    (data: readonly T[], event: RxSetEventInfo<T>): void;
}

/**
 * A reactive set is basically a specialized reactive value which has been optimized
 * around CRUD APIs. Any time an item is created, edited, or deleted--and keep in mind
 * these changes may occur in bulk because the frontend has a task system--there is no
 * need to recompute all information further down the line: we can perform granular
 * updates. This is especially relevant for data table performance, where we may aggregate
 * information from several sources amongst thousands of rows.
 */
export interface RxSet<T> {
    /**
     * Subscribe to the set. The callback you provide MIGHT NOT BE CALLED IMMEDIATELY. It
     * depends on the reactive set implementation being used.
     */
    subscribe(callback: RxSetDataCallback<T>): RxUnsubscribeFn;
}
export namespace RxSet {
    /**
     * Just an empty set to use as a placeholder anywhere a real reactive
     * set is not available yet, because, say, you need to load asynchronous
     * information before you can properly filter out a data source like users
     * or VM images.
     */
    export const EMPTY: RxSet<any> = {
        subscribe(callback: RxSetDataCallback<any>): RxUnsubscribeFn {
            callback([], { type: RxSetEvent.Refresh });
            return doNothing;
        },
    };
}

/**
 * Utility class for unsubscribing and resubscribing to the same underlying
 * reactive set repeatedly. This is useful for higher-order reactive sets
 * like table drivers (which aggregate information from one or more underlying
 * sets) because they should only listen to lower-level data sources and
 * continually compute information while THEY are subscribed to themselves.
 */
export class RxSetResubscriber<Item> {

    private unsubscribeFn?: RxUnsubscribeFn;

    constructor(
        private readonly rxList: RxSet<Item>,
        private readonly listener: RxSetDataCallback<Item>,
    ) { }

    resubscribe(): void {
        this.unsubscribeFn ??= this.rxList.subscribe(this.listener);
    }

    unsubscribe(): void {
        if (typeof this.unsubscribeFn === "function") {
            this.unsubscribeFn();
            this.unsubscribeFn = undefined;
        }
    }

}
