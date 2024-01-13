
/**
 * A stream listener is a set of callbacks which should be called when events
 * occur for the relevant backend stream.
 */
export interface StreamListener {
    (payload: Uint8Array | Error | undefined, streamClosed: boolean): void;
}

/**
 * A backend transport is an abstract entity/layer responsible for dispatching
 * requests to the backend/server, mapping replies back, and managing stream
 * subscriptions.
 * 
 * This abstraction provides a nice interop between low-level single-use connections
 * (websockets) and higher-level code that implements the same interface but can, for
 * example, re-open a new connection as necessary.
 */
export interface BackendTransport {
    subscribe(streamID: number, listener: StreamListener): void;
    send(type: string, payload: Uint8Array): Promise<Uint8Array>;
    sendIgnoreReply(type: string, payload: Uint8Array): Promise<void>;
    write(streamID: number, payload?: any): Promise<void>;
    closeStream(streamID: number): Promise<void>;
}