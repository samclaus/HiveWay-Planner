import { removeFirstOccurrence } from "../lib/array-util";
import type { RxDataCallback as DataCallback, RxUnsubscribeFn as UnsubscribeFn } from "./_util";

/**
 * A simple reactive data source which contains a single
 * piece of data, be it a boolean, string, number, or an
 * object or some sort of collection.
 */
export interface RxValue<T> {
    /**
     * Subscribe to the data source. The callback you provide
     * MIGHT NOT BE CALLED IMMEDIATELY. It depends on the
     * reactive value implementation being used.
     */
    subscribe(subscriber: DataCallback<T>): UnsubscribeFn;
}

/**
 * Stricter version of `rx.Value<T>` interface which also requires exposing the
 * current state of the reactive value (not just a subscribe method that may or
 * may not fire the callback synchronously).
 */
export interface RxValueWithSnapshot<T> extends RxValue<T> {
    /**
     * The current underlying value; the main purpose of this field is to keep TypeScript
     * happy when initializing higher-level state and should be used in conjunction with
     * the regular subscribe() pattern to keep things actually reactive.
     */
    readonly snapshot: T;
}

/**
 * Reactive value implementation which immediately gives each new subscriber the
 * same inner value and does not do anything afterwards.
 */
export class RxFinalValue<T> implements RxValueWithSnapshot<T> {

    constructor(
        readonly snapshot: T,
    ) { }

    subscribe(cb: DataCallback<T>): UnsubscribeFn {
        cb(this.snapshot);
        return function(): void {}
    }

}

/**
 * Simple reactive value implementation which assumes there will not
 * be very many concurrent consumers and stores subscriptions in an
 * array, splicing out the relevant callback (if it is still there)
 * whenever a a consumer unsubscribes.
 * 
 * Each time a consumer subscribes, they will be immediately
 * given the current value. You must pass an initial value,
 * and explicitly type it if you want to have an initial
 * 'empty' state (just use undefined!).
 * 
 * Returns the value and a callback for publishing data to it,
 * in that order.
 */
export class RxMutableValue<T> implements RxValueWithSnapshot<T> {

    private readonly subscriptions: DataCallback<T>[] = [];

    constructor(
        public snapshot: T,
    ) { }

    subscribe(callback: DataCallback<T>): UnsubscribeFn {
        // NOTE: call the callback first so that we do not even register it if it throws an error
        callback(this.snapshot);

        this.subscriptions.push(callback);

        return (): void => {
            removeFirstOccurrence(this.subscriptions, callback);
        };
    }

    /**
     * Emit the current value to all subscribers. This is exposed for situations where you
     * want to mutate an underlying array or object directly and then just call subscribers.
     */
    emit(): void {
        const {snapshot} = this;

        for (const callback of this.subscriptions) {
            try {
                callback(snapshot);
            } catch (error) {
                console.error(
                    "RxMutableValue<T> subscriber threw error when called:",
                    { callback, error },
                );
            }
        }
    }

    setValue(value: T): void {
        this.snapshot = value;
        this.emit();
    }

}
