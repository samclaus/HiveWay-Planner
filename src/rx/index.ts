import * as cache from "./_cache";
import * as remoteSet from "./_remote-set";
import * as searcher from "./_searcher";
import * as set from "./_set";
import * as setBase from "./_set-base";
import * as filter from "./_stateless-filter";
import * as sort from "./_stateless-sort";
import * as transform from "./_stateless-transform";
import * as universalSet from "./_universal-set";
import * as util from "./_util";
import * as value from "./_value";

// TODO: re-exporting generic types with TypeScript "--isolatedModules" field is really
// weird and doesn't seem to be good, especially considering it loses the documentation
// comment so you can no longer hover on, say, 'rx.Value' and get the tooltip sourced
// from the original 'RxValue' interface comment. A lot of this stuff is also not used
// in this project yet and will likely not compile correctly once it is..

export namespace rx {

    // Utilities
    export type HasID = util.RxHasID;
    export import DataCallback = util.RxDataCallback;
    export type UnsubscribeFn = util.RxUnsubscribeFn;
    export import unsubFromAll = util.rxUnsubFromAll;

    // Simple all-or-nothing values with no collection semantics
    export type Value<T> = value.RxValue<T>;
    export type ValueWithSnapshot<T> = value.RxValueWithSnapshot<T>;
    export import FinalValue = value.RxFinalValue;
    export import MutableValue = value.RxMutableValue;

    // Master key-value caches (should only be one per backend collection)
    export type ItemStatus<T> = cache.RxCacheItemStatus<T>;
    export type ItemStatusCallback<T> = cache.RxCacheStatusCallback<T>;
    export type AbstractCache<T extends HasID> = cache.RxAbstractCache<T>;
    export type AutofetchingCache<T extends HasID> = cache.RxAutofetchingCache<T>;
    export import ItemRewatcher = cache.RxCacheRewatcher;

    // Sets of unique items, in array form, with CRUD events
    export import SetEvent = set.RxSetEvent;
    export type SetDataCallback<T> = set.RxSetDataCallback<T>;
    export import Set = set.RxSet;
    export import SetResubscriber = set.RxSetResubscriber;
    export import SetBase = setBase.RxSetBase;

    // Higher-level, composable set modifiers
    export type StatelessFilterHandle<T extends HasID> = filter.RxStatelessFilterHandle<T>;
    export import statelessFilter = filter.rxStatelessFilter;
    export import statelessTransform = transform.statelessTransform;
    export type StatelessSearchOpts<T> = searcher.RxStatelessSearchOpts<T>;
    export type StatelessSearchHandle<T extends HasID> = searcher.RxStatelessSearchHandle<T>;
    export import statelessSearch = searcher.rxStatelessSearch;
    export import statelessSort = sort.rxStatelessSort;

    // Remote sets, which add refreshing semantics to abstract sets and serve as the
    // bread-and-butter of APIs which involve "all" vs. "own" and other subset semantics
    export import RemoteSet = remoteSet.RxRemoteSet;
    export import AutorefreshingRemoteSet = remoteSet.RxAutorefreshingRemoteSet;

    // Universal sets, which combine the semantics of remote sets and caches and are optimized
    // internally for cases where an API is very simple and you can either pull the entire
    // collection or nothing at all
    export import UniversalSet = universalSet.RxUniversalSet;

    export function timeout(ms: number, callback: () => void): UnsubscribeFn {
        const timeoutID = window.setTimeout(callback, ms);

        return () => window.clearTimeout(timeoutID);
    }

    /**
     * Subscribe to a reactive value, store whatever it gives us, then immediately
     * unsubscribe and return whatever it gave us. If the reactive value does not
     * pass us any data synchronously, this function will return undefined.
     * 
     * @deprecated This only exists to bridge the gap while we move everything to
     * reactive logic. It is basically an escape hatch to just grab the current
     * value and not be forced to think about how to update the interface as things
     * change.
     */
    export function immediate<T>(value: Value<T>): T | undefined {
        let inner: T | undefined;

        value.subscribe(data => {
            inner = data;
        })(); // Notice the extra parenthesis to immediately unsubscribe

        return inner;
    }

}