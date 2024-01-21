import { decode, encode } from "msgpack-ts";
import { hexEncode } from "../encoding";
import { Deferred } from "../lib/async-util";
import { WEBSOCKET_CLOSE_NORMAL, openWebsocket, readBinaryMessage } from "../lib/websocket-util";
import { rx } from "../rx";
import type { BackendTransport, StreamListener } from "./transport";
import type { UserInfo } from "./user";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegistrationRequest {
    registration_token: string;
    username: string;
    password: string;
    email?: string | undefined;

    // TODO: more required fields (like registration token, etc.)
}

export type AuthRequest = LoginRequest | RegistrationRequest;

/**
 * FOR THE VERSION 0 PROTOCOL (ALL OF THIS CAN CHANGE BETWEEN VERSIONS)
 * 
 * ### A front-to-back connection message consists of the following, in order:
 * 
 * 1. A single byte, interpreted as an unsigned integer, which denotes whether
 * the message is a request (value 0) or a stream operation (value is 1)
 * 2. The rest of the bytes will be interpreted according to the type byte above
 * 
 * For a request, there will be:
 * 
 * 1. A 4-byte unsigned integer which will be used as the request ID; when the server
 * sends a response down the wire, it will use this ID so the frontend knows which
 * request the response is for. The frontend should increment a counter and use the
 * current value every time it sends a request (commonly referred to as a sequence
 * number).
 * 2. A MessagePack-encoded string which is the request type, e.g., "discussion:create".
 * 3. The rest of the bytes will be interpreted on the server according to the request
 * type. Continuing the earlier example, for a "discussion:create" request, the server
 * would (and this is all hypothetical) interpret the bytes as a MessagePack-encoded
 * object containing fields like the name for the discussion. Regarding backwards
 * compatibility, TODO...
 * 
 * For a stream, there will be:
 * 
 * 1. A 4-byte unsigned integer which will be used as the stream ID; streams may only be
 * opened by the server and the message will be silently ignored by the server if no stream
 * is open with the provided stream ID.
 * 2. A 1-byte stream status which will be interpreted as a bitset. If none of the status bits
 * are set, the server will silently ignore the message. If the 'data' bit is set, the handler
 * for the stream (on the server) will be given the remaining bytes (described next) as a raw
 * binary payload. If the 'close' bit is set, the server will close the stream; this is not
 * mutually exclusive with the 'data' bit, i.e., a single WebSocket message could pass data to
 * the stream and then close it. The 'error' bit indicates that the payload should be treated
 * as an error (meaning it is irrelevant if the 'data' bit is not set), but it is up to the
 * stream handler to decide what that means (it may just treat every payload identically). The
 * 'error' bit primarily exists for server->client stream messages.
 * 3. The rest of the bytes from the WebSocket message will simply be passed to the stream handler
 * if the 'data' status bit is set (some stream handlers might expect a MessagePack-encoded payload,
 * some might expect raw data say for a file upload, some might expect a mixed structure, and vice
 * versa).
 * 
 * ### A back-to-front connection message consists of the following, in order:
 * 
 * 1. A single byte, interpreted as an unsigned integer, which denotes whether
 * the message is a reply (value 0) or a stream operation (value is 1)
 * 2. The rest of the bytes will be interpreted according to the type byte above
 * 
 * For a reply, there will be:
 * 
 * 1. A 4-byte unsigned integer which is the request ID this reply corresponds to.
 * 2. A byte which will be zero for success replies and nonzero for error replies.
 * 3. The rest of the bytes should be interpreted as a standard MessagePack-encoded error
 * format (not described here) if the previous byte is nonzero, or according to the request
 * type the reply is for otherwise.
 * 
 * For a stream, there will be:
 * 
 * 1. A 4-byte unsigned integer which will be used as the stream ID; if the client does not recognize
 * the stream ID (i.e., a handler is not registered), it should store a buffer of messages for the stream
 * until application-level code does subscribe, at which point the connection-level code can replay the
 * messages in-order. This is because the backend may open a stream corresponding to a request before sending
 * back the reply, and it makes more sense for the client to handle this occurrence than it does for the
 * server to struggle to provide strict guarantees.
 * 2. A 1-byte stream status which will be interpreted as a bitset. If none of the status bits
 * are set, the client should silently ignore the message. If the 'data' bit is set, the handler
 * for the stream (on the client) should be given the remaining bytes (described next) as a raw
 * binary payload. If the 'close' bit is set, the server will close the stream; this is not
 * mutually exclusive with the 'data' bit, i.e., a single WebSocket message could pass data to
 * the stream and then close it. The 'error' bit indicates that the payload should be treated
 * as an error (meaning it is irrelevant if the 'data' bit is not set).
 * 3. The rest of the bytes from the WebSocket message will simply be passed to the stream handler
 * if the 'data' status bit is set (some stream handlers might expect a MessagePack-encoded payload,
 * some might expect raw data say for a file download, some might expect a mixed structure, and vice
 * versa).
 */
const enum MessageType {
    RequestReply = 0,
    Stream = 1,
}

const enum StreamStatus {
    Data = 1,
    Error = 2,
    Closed = 4,
}

type StreamBuffer = [
    /**
     * Data and error payloads, which will be fed to a new subscriber in order.
     */
    (Uint8Array | BackendError)[],
    /**
     * Whether the stream has been closed. If true, this will be fed to a new
     * subscriber when giving it the last data/error payload. If there are no
     * data/error payloads, a new subscriber will just be given an undefined
     * payload along with a 'true' parameter to tell it the stream has been
     * closed.
     */
    boolean,
];

/**
 * Error response structure for the backend/server.
 */
export class BackendError extends Error {

    /**
     * Human-readable description of the error, such as "Invalid session token"
     * or "course does not exist" (continuing from the error code examples). This
     * will generally be a very rudimentary default message for the error, and the
     * frontend is expected to provide more context for better feedback if possible.
     */
    declare readonly message: string;
    
    constructor(
        /**
         * The error code, such as "ses-dne" or "course-dne".
         */
        readonly code: string,
        message: string,
        /**
         * Optional additional details, depending on the error type.
         * 
         * This can contain helpful information for the frontend. For instance (this is
         * not currently a REAL example, just hypothetical), if you try to add an entry
         * to a directory but there is a conflicting entry (same name) already present,
         * the backend should probably assume that the directory information in the
         * frontend is out-of-date and can just send you back all the current entries
         * for the directory without the frontend having to make another request to
         * refresh it.
         */
        readonly details: unknown,
    ) {
        super(message);
    }

}

function safeExtractError(payload: Uint8Array): BackendError {
    let decoded: {
        code: string;
        message: string;
        details: unknown;
    };

    try {
        decoded = payload && decode(payload);

        if (
            !decoded ||
            typeof decoded !== "object" ||
            typeof decoded.code !== "string" ||
            typeof decoded.message !== "string"
        ) {
            console.error(
                "Successfully decoded error reply from the backend " +
                "but it did not have the expected structure:",
                decoded,
            );

            return new BackendError(
                "bad-server-error-missing-expected-fields",
                "(got an error from the backend but the MessagePack structure was missing the expected information)",
                payload,
            );
        }

        return new BackendError(decoded.code, decoded.message, decoded.details);
    } catch (err) {
        console.error("Failed to even decoded error reply from the backend:", err);
        console.error(
            "Here is the binary payload (as hex): " +
            payload ? hexEncode(payload, " ") : "(no payload even provided!)",
        );

        return new BackendError(
            "bad-server-error-invalid-encoding",
            "(got an error from the backend but it was not encoded using MessagePack)",
            payload,
        );
    }
}

const utf8Encoder = new TextEncoder();
const EMPTY_PAYLOAD = new Uint8Array(0);

/**
 * Transient websocket-based connection to a HiveWay backend/server. Once the underlying
 * websocket closes, the instance is no longer usable and must be replaced with an entirely
 * new one to continue talking to the server.
 * 
 * This connection only supports version 0 of the websocket protocol (which will be an evolving
 * standard until official release, at which point breaking changes will be demarcated by
 * incrementing the version number). If the handshake from the server indicates that it is using
 * a later version of the protocol, an error will be thrown and the connection will be killed.
 */
export class TransientBackendConn implements BackendTransport {

    /**
     * Dial (attempt to connect to) an HiveWay server's websocket endpoint.
     * 
     * TODO: timeouts are really a simpler albeit worse solution than giving users the ability to
     * decide when to give up on an operation. Ideally, this function would take an AbortSignal
     * (part of the JavaScript standard) that code outside of this function could trigger to make
     * us give up on waiting for the server to reply at any time. Then, the user could be shown a
     * button in the login screen to cancel the login attempt if the server is being really slow.
     * Otherwise, they can let it be and choose to wait if they think the server is just under load
     * and not totally broken.
     */
    static async dial(
        url: string,
        auth: AuthRequest,
        /**
         * How long to wait for the server to respond (success OR failure) before giving up.
         */
        handshakeTimeout = 30_000,
    ): Promise<TransientBackendConn> {
        interface LoginSuccessful {
            // TODO: give these types
            protocol: number;
            server: {};
            user: UserInfo;
            session: {};
        }

        // Attempt to open the websocket
        const ws = await openWebsocket(url, handshakeTimeout);
        const ourProtocol = 0;

        // Immediately send our authentication handshake
        ws.send(encode({ ...auth, protocol: ourProtocol }));

        // We expect the server to send back our user information as well as system information,
        // or an error IF IT WANTS to tell us what we got wrong, in which case the first byte of
        // the response will be nonzero; OR, the server may NOT tell us what we got wrong and may
        // just close the websocket, causing this process to error out
        const response = await readBinaryMessage(ws, handshakeTimeout);

        // If the first byte is nonzero, it means the server is sending us an error response which
        // is useful because it means we can give more feedback to the user than just "sorry, the
        // server didn't like us and murdered the WebSocket connection"
        if (response[0] !== 0) {
            // We EXPECT the rest of the binary response to be a MessagePack-encoded error format;
            // refer to the safeExtractError function for more information--it even handles the case
            // where the server just sends us some random nonsense bytes
            throw safeExtractError(response.subarray(1));
        }

        const {protocol: serverProtocol, user} = decode<LoginSuccessful>(response.subarray(1));

        // Make sure we are running the same protocol version
        if (serverProtocol !== ourProtocol) {
            // Close the websocket because we do not know how to communicate with this version of the
            // server; it would be bad if we threw an error from this function but never cleaned up
            // the websocket
            //
            // See https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5 for a list of websocket
            // error codes and what they mean--we must use a close code in the range [3000, 4999]
            // because other integers are reserved for standard use by the browsers/servers. We will
            // use the code 3000 to indicate a protocol version mismatch in this application
            // TODO: document the code 3000 in the server wiki to OFFICIALLY designate it
            ws.close(3000, "protocol version mismatch (wanted version 0)");

            throw new Error(`mismatched client/server protocol version (server is running v${serverProtocol})`);
        }

        // Because of JavaScript's turn-based/evented nature, we need to check if the connection got closed,
        // say, after we read the server's handshake (which was a promise-based function call), but BEFORE
        // the browser propagated the promise result and resumed this function we are in. If everything in
        // this function is synchronous code (no promises, callbacks, etc.), it would technically be safe to
        // assume the websocket is not in a closed state yet but even then it's better to be safe rather than
        // sorry since we would probably add asynchronous steps in the future. 
        //
        // If you are confused about this stuff, that is 100% OK: reasoning about events, callbacks, promises,
        // async functions, and the order the code gets executed in is--I would argue--the hardest part about
        // JavaScript. It may just take a lot of time spent stepping through the debugger and console-logging
        // things to wrap your head around it, but once you get it, it will all be clear!
        if (ws.readyState !== WebSocket.OPEN) {
            throw new Error("connection closed during handshake");
        }

        return new TransientBackendConn(ws, user);
    }

    /**
     * Reactive (subscribable) boolean determining whether this connection has been
     * closed, in which case a new connection will need to be opened to continue
     * talking to the server.
     */
    readonly closed$: rx.ValueWithSnapshot<boolean>;

    private readonly closedMut: rx.MutableValue<boolean>;

    /**
     * Map of request IDs to deferred promises so we can wrap the event-based
     * socket with a promise-based API.
     */
    private readonly responseListeners = new Map<number, Deferred<Uint8Array>>();

    /**
     * Map of stream IDs to listener callbacks.
     */
    private readonly streamListeners = new Map<number, StreamListener>();

    /**
     * Map of stream IDs to data buffers in case a stream listener is not
     * registered before the stream is opened by the server.
     */
    private readonly streamBuffers = new Map<number, StreamBuffer>();

    /**
     * Simple counter for generating unique request IDs, which are used to
     * map responses and/or streams to requests.
     */
    private requestCounter = 0;

    private constructor(
        private readonly socket: WebSocket,
        readonly user: UserInfo,
    ) {
        this.closedMut = new rx.MutableValue(false);
        this.closed$ = this.closedMut;

        socket.onmessage = this.handleWebsocketMessage.bind(this);
        socket.onclose = this.handleWebsocketClose.bind(this);
    }

    get open(): boolean {
        return this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Subscribe to a stream.
     */
    subscribe(streamID: number, listener: StreamListener): void {
        this.streamListeners.set(streamID, listener);

        const buffer = this.streamBuffers.get(streamID);

        if (!buffer) {
            // Nothing to do
            return;
        }

        this.streamBuffers.delete(streamID);

        const [payloads, isClosed] = buffer;
        const lastPayload = payloads.pop();

        for (const payload of payloads) {
            listener(payload, false);
        }

        listener(lastPayload, isClosed);
    }

    /**
     * Send a message to the server. This method respects the dispatch chain and waits
     * for the previous dispatch to finish before dispatching the message.
     */
    private dispatchRequest(type: string, id: number, payload = EMPTY_PAYLOAD): void {
        const typeUTF8 = utf8Encoder.encode(type);

        if (typeUTF8.length > 255) {
            // TODO: remove this whole check and just use msgpack-ts encode() function
            // for the type once I implement things properly on the server
            throw new Error(
                `cannot encode request type "${type}" because its UTF-8 length ` +
                "exceeds 255 bytes and the HiveWay server currently only " +
                "supports MessagePack str 8 encoding for the type"
            );
        }

        const message = new Uint8Array(7 + typeUTF8.length + payload.length);
        const dataView = new DataView(message.buffer);
        
        message[0] = MessageType.RequestReply;
        dataView.setUint32(1, id);
        message.set([0xd9, typeUTF8.length], 5); // str 8 header
        message.set(typeUTF8, 7); // now the actual contents of the type string
        message.set(payload, 7 + typeUTF8.length);

        this.socket.send(message);
    }

    /**
     * Sends a request and awaits the reply. The returned promise will only
     * fulfill if (1) the message is dispatched successfully, (2) a response is
     * received before the websocket is closed, and (3) the response is not an
     * error; it will be rejected otherwise. If a stream listener is provided,
     * it will be registered using the generated request ID as the stream ID.
     */
    async send(type: string, payload?: Uint8Array): Promise<Uint8Array> {
        if (!this.open) {
            throw new Error("connection is closed");
        }

        const deferred = new Deferred<Uint8Array>();
        const id = this.requestCounter++;

        // NOTE: dispatchRequest() calls WebSocket#send() internally, which ENQUEUES a
        // message to be sent, meaning that we are guaranteed to execute the line that
        // registers the response listener before we could possibly receive a response;
        // the benefit of putting the lines in this order is that if dispatchRequest()
        // fails, the error will simply propagate and we will not register the response
        // listener in the map (good since the request never got sent successfully)
        this.dispatchRequest(type, id, payload);
        this.responseListeners.set(id, deferred);

        return deferred.promise;
    }

    /**
     * Send a request but do not await the reply.
     * 
     * @throws If message dispatch fails because the websocket is closed, and vice versa.
     */
    async sendIgnoreReply(type: string, payload?: Uint8Array): Promise<void> {
        if (!this.open) {
            throw new Error("connection is closed");
        }

        this.dispatchRequest(type, this.requestCounter++, payload);
    }

    /**
     * Write to a bidirectional stream.
     */
    async write(streamID: number, payload: Uint8Array, closeStream?: boolean): Promise<void> {
        // TODO: debugging hook?
        // TODO: JavaScript APIs like WebSocket#send() just make a copy of whatever
        // Uint8Array we give them (they have to in order to provide basic guarantees),
        // so we may just want to keep reusing the same buffer and mutate it with a new
        // stream ID before sending it.

        const message = new Uint8Array(6 + payload.length);
        const dataView = new DataView(message.buffer);
        
        message[0] = MessageType.Stream;
        dataView.setUint32(1, streamID);
        message[5] = StreamStatus.Data;
        message.set(payload, 6);

        if (closeStream) {
            message[5] |= StreamStatus.Closed;
        }

        this.socket.send(message);
    }

    async closeStream(streamID: number): Promise<void> {
        // TODO: debugging hook?
        // TODO: JavaScript APIs like WebSocket#send() just make a copy of whatever
        // Uint8Array we give them (they have to in order to provide basic guarantees),
        // so we may just want to keep reusing the same buffer and mutate it with a new
        // stream ID before sending it.

        const message = new Uint8Array(6);
        const dataView = new DataView(message.buffer);
        
        message[0] = MessageType.Stream;
        dataView.setUint32(1, streamID);
        message[5] = StreamStatus.Closed;

        this.socket.send(message);
    }

    /**
     * Close the underlying websocket. Idempotent: does nothing if the websocket
     * is already closed or closing.
     */
    close(reason?: string): void {
        this.socket.close(WEBSOCKET_CLOSE_NORMAL, reason);
    }

    private handleWebsocketMessage(ev: MessageEvent): void {
        let message: Uint8Array;

        if (ev.data instanceof ArrayBuffer) {
            message = new Uint8Array(ev.data);
        } else if (ev.data instanceof Uint8Array) {
            message = ev.data;
        } else {
            console.error(
                "Received websocket message which was not ArrayBuffer or Uint8Array:",
                ev.data,
            );

            return;
        }

        try {
            const msgType = message[0];
            const dataView = new DataView(
                message.buffer,
                message.byteOffset,
                message.byteLength,
            );

            if (msgType === MessageType.RequestReply) {
                this.handleReply(
                    dataView.getUint32(1),      // request ID
                    dataView.getUint8(5) !== 0, // is error?
                    message.subarray(6),        // rest of message is the payload
                );
            } else if (msgType === MessageType.Stream) {
                this.handleStreamChunk(
                    dataView.getUint32(1), // stream ID
                    dataView.getUint8(5),  // status
                    message.subarray(6),   // rest of message is the payload
                );
            } else {
                throw new Error("first byte is not 0 (reply) or 1 (stream message)");
            }
        } catch (err) {
            console.debug(`Failed to decode websocket message (${hexEncode(message, " ")}) from the server:`, err);
        }
    }

    private handleWebsocketClose(): void {
        this.closedMut.setValue(true);

        for (const listener of this.responseListeners.values()) {
            listener.reject(new Error("connection closed"));
        }
        for (const listener of this.streamListeners.values()) {
            try {
                listener(undefined, true);
            } catch (err) {
                console.error("Stream subscription threw error when notified of connection close:", err);
            }
        }

        this.responseListeners.clear();
        this.streamListeners.clear();
        this.streamBuffers.clear();
    }

    private handleReply(rid: number, isError: boolean, payload: Uint8Array): void {
        const listener = this.responseListeners.get(rid);

        if (!listener) {
            console.warn(
                `Got unexpected ${isError ? "error" : "success"} reply from ` +
                `backend [requestID: ${rid}]: ${hexEncode(payload, " ")}`,
            );

            return;
        }

        // Now unregister the listener
        this.responseListeners.delete(rid);

        // TODO: hooks for request logging/viewing

        if (isError) {
            listener.reject(safeExtractError(payload));
        } else {
            listener.resolve(payload);
        }
    }

    private handleStreamChunk(streamID: number, status: number, rawPayload: Uint8Array): void {
        const listener = this.streamListeners.get(streamID);
        const isError = (status & StreamStatus.Error) !== 0;
        const isClosed = (status & StreamStatus.Closed) !== 0;

        // TODO: debugging hooks

        const payload = (status & StreamStatus.Data)
            ? (isError ? safeExtractError(rawPayload) : rawPayload)
            : undefined;

        if (listener) {
            try {
                listener(payload, isClosed);
            } catch (err) {
                // TODO: add more context?
                console.error("Stream listener threw error:", err);
            }

            if (isClosed) {
                this.streamListeners.delete(streamID);
            }
        } else {
            const buffer = this.streamBuffers.get(streamID);

            if (buffer) {
                if (payload) {
                    buffer[0].push(payload);
                }
                buffer[1] ||= isClosed;
            } else {
                this.streamBuffers.set(streamID, [
                    payload ? [payload] : [],
                    isClosed,
                ]);
            }
        }
    }
    
}
