
/**
 * Interface for any object with a string "id" field.
 * Very useful for abstractions around CRUD APIs.
 */
export interface RxHasID {
    readonly id: string;
}

/**
 * Assumes the given array contains at most ONE item with the given ID. If an item
 * is found with the ID, the item is removed (spliced) from the array, mutating the
 * array.
 */
export function removeUniqueID<T extends RxHasID>(arr: T[], id: string): T | undefined {
    for (let i = 0; i < arr.length; ++i) {
        if (arr[i]!.id === id) {
            return arr.splice(i, 1)[0];
        }
    }
    return undefined;
}

/**
 * Assumes the given array contains at most ONE item with the given ID. If an item
 * is found with the ID, it is replaced (mutating the array) with the new version.
 * The old version, if it existed, is returned.
 */
export function replaceUniqueID<T extends RxHasID>(arr: T[], updated: T, id = updated.id): T | undefined {
    for (let i = 0; i < arr.length; ++i) {
        if (arr[i]!.id === id) {
            const old = arr[i];
            arr[i] = updated;
            return old;
        }
    }
    return undefined;
}

/**
 * A simple callback for passing around data. You might
 * register a callback to receive data when information
 * is updated (meaning you are a consumer), or you might
 * use a similar callback as a data source to publish
 * such updates (sending them to the consumers).
 */
export interface RxDataCallback<T> {
    (data: T): void;
}
export namespace RxDataCallback {
    /**
     * Wrap a data callback so that it will only get called with values which are not undefined or null.
     */
    export function ignoreNullish<T>(innerCallback: RxDataCallback<T>): RxDataCallback<T | undefined | null> {
        return function (val: T | undefined | null): void {
            if (val !== undefined && val !== null) {
                innerCallback(val);
            }
        };
    }
}

/**
 * A simple callback for unsubscribing from any sort of
 * reactive state. Unsubscribing means telling the data
 * source to remove the callback you provided to it when
 * you subscribed.
 * 
 * Most reactive data sources will not clear subscriptions
 * automatically, and even if they do it will generally be
 * delayed until they do so for a specific reason, like
 * the page was logged out or you disconnected from a VM.
 * 
 * Failing to unsubscribe means a very serious memory leak
 * because your callback will continue to be called with
 * new information, and chances are that your callback
 * passes data onto a component instance for display in
 * the DOM, meaning that whole component instance cannot
 * be garbage collected either.
 */
export interface RxUnsubscribeFn {
    (): void;
}

export function rxUnsubFromAll(unsubCallbacks: readonly RxUnsubscribeFn[]): void {
    for (const unsub of unsubCallbacks) {
        unsub();
    }
}
