import { TimeoutError } from "./timeout-error";

/**
 * Status code for closing a websocket normally, i.e., the user simply closed the
 * connection or some other "expected" thing resulted in it being closed.
 * 
 * Application JavaScript can only close a websocket with this close code, or a code
 * in the range [3000, 4999] because all other integer close codes are reserved for
 * use by the browser (websocket implementation).
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
 */
export const WEBSOCKET_CLOSE_NORMAL = 1000;

/**
 * Dials the given url, fulfilling on successful connection.
 */
export function openWebsocket(
    url: string,
    timeoutMS: number
): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.binaryType = "arraybuffer";

        const timeoutID = window.setTimeout(() => {
            socket.onopen = null;
            socket.onmessage = null;
            socket.onerror = null;
            reject(
                new TimeoutError(
                    timeoutMS,
                    `took longer than ${Math.floor(timeoutMS / 1000)}s to open a websocket`,
                ),
            );
        }, timeoutMS);

        socket.onopen = () => {
            socket.onopen = null;
            socket.onerror = null;
            window.clearTimeout(timeoutID);
            resolve(socket);
        };
        socket.onerror = err => {
            socket.onopen = null;
            socket.onerror = null;
            window.clearTimeout(timeoutID);
            reject(err);
        };
    });
}

/**
 * Waits for a message from the given websocket and fulfills with it.
 */
export function readBinaryMessage(
    socket: WebSocket,
    timeoutMS = 30_000,
): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
        const timeoutID = window.setTimeout(() => {
            socket.onmessage = null;
            socket.onerror = null;
            socket.onclose = null;
            reject(
                new TimeoutError(
                    timeoutMS,
                    `took longer than ${Math.floor(timeoutMS / 1000)}s to receive a websocket message`,
                ),
            );
        }, timeoutMS);

        socket.onmessage = message => {
            socket.onmessage = null;
            socket.onerror = null;
            socket.onclose = null;
            window.clearTimeout(timeoutID);
            resolve(new Uint8Array(message.data));
        };
        socket.onerror = socketErr => {
            socket.onmessage = null;
            socket.onerror = null;
            socket.onclose = null;
            window.clearTimeout(timeoutID);
            reject(socketErr);
        };
        socket.onclose = () => {
            socket.onmessage = null;
            socket.onerror = null;
            socket.onclose = null;
            window.clearTimeout(timeoutID);
            reject(new Error("connection closed unexpectedly"));
        };
    });
}
