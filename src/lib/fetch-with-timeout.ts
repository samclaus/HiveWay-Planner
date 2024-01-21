import { Deferred } from "./async-util";
import { doNothing } from "./do-nothing";
import { TimeoutError } from "./timeout-error";

/**
 * This function is almost identical to `Window.fetch()` but adds a timeout which will abort the request
 * and thus fail the promise if the request does not resolve in time.
 *
 * Credit to Aadit Shah for the elegant implementation: https://stackoverflow.com/a/57888548/5054792
 */
export function fetchWithTimeout(
    url: string,
    ms: number,
    { signal, ...opts }: RequestInit = {}
): Promise<Response> {
    let { promise, resolve, reject } = new Deferred<Response>();

    // NOTE: this fancy machinery is to make our timeout-based abort of the
    // fetch play nicely with any abort signal passed to us, in case the
    // function caller wants to abort the request under other conditions as
    // well.
    const controller = new AbortController();

    // NOTE: I use a deferred promise in order to prevent the ugly DOMError
    // messages produced by aborting the request from ever reaching the user.
    // If our timeout actually goes through, it will reject the deferred
    // promise with a pretty timeout error and make resolve/reject no-ops so
    // that the rejection of the fetch promise does nothing.
    fetch(url, { signal: controller.signal, ...opts }).then(
        resolve,
        reject,
    );

    if (signal) {
        signal.addEventListener("abort", () => controller.abort());
    }

    const timeout = setTimeout(() => {
        reject(new TimeoutError(ms, `the server took longer than ${Math.floor(ms / 1000)}s to reply`));
        resolve = doNothing;
        reject = doNothing;
        controller.abort();
    }, ms);

    return promise.finally(() => clearTimeout(timeout));
}
