import { TransientBackendConn, type AuthRequest } from "../backend/transient-conn";
import { rx } from "../rx";

export type SessionState = {
    state: "logged-out";
    authErr: unknown;
} | {
    state: "authenticating";
} | {
    state: "logged-in";
    conn: TransientBackendConn;

    // TODO: this is just a stop-gap so we can show some sort of success banner in the
    // UI after you register successfully (since it authenticates you immediately), and
    // there is probably a cleaner way to handle such state
    firstLogin: boolean;
};

const sessionMut = new rx.MutableValue<SessionState>({
    state: "logged-out",
    authErr: undefined,
});

export const SESSION$: rx.ValueWithSnapshot<SessionState> = sessionMut;

export function authenticate(auth: AuthRequest): void {
    if (sessionMut.snapshot.state !== "logged-out") {
        // TODO: perhaps we should check whether we are logged out or currently
        // in the process of logging in, and whether we are currently logging
        // in under a different username than the one that just got passed to the
        // function--needs thought
        return;
    }

    const firstLogin = 'registration_token' in auth;

    sessionMut.setValue({ state: "authenticating" });

    // TODO: more retries, but just trying once keeps debugging simple
    TransientBackendConn.dial("ws://localhost:8080/connect", auth).then(
        conn => {
            sessionMut.setValue({ state: "logged-in", conn, firstLogin });

            const unsub = conn.closed$.subscribe(connClosed => {
                if (!connClosed) {
                    return;
                }

                sessionMut.setValue({ state: "logged-out", authErr: undefined });

                // IMPORTANT: if the connection closed immediately, we will not have returned
                // from the enclosing .subscribe(() => { ... }), so the 'unsub' callback will
                // not be defined, so we use a setTimeout call with a WRAPPER function to EVALUATE
                // the variable and THEN call it, all in the next turn of the event loop
                setTimeout(() => unsub());
            });
        },
        err => {
            sessionMut.setValue({ state: "logged-out", authErr: err });
        },
    );
}

export async function request(type: string, payload?: Uint8Array): Promise<Uint8Array> {
    const current = sessionMut.snapshot;

    if (current.state !== "logged-in") {
        // TODO: queue request for when we reconnect, etc? Depending on circumstances
        throw new Error("not logged in");
    }

    return current.conn.send(type, payload);
}

export async function requestIgnoreReply(type: string, payload?: Uint8Array): Promise<void> {
    const current = sessionMut.snapshot;

    if (current.state !== "logged-in") {
        // TODO: queue request for when we reconnect, etc? Depending on circumstances
        throw new Error("not logged in");
    }

    await current.conn.sendIgnoreReply(type, payload);
}

export function logout(): void {
    const current = sessionMut.snapshot;

    if (current.state === "logged-in") {
        // Close the connection; this will trigger the state change to logged out
        // because we already have reactive logic in place so that no matter how
        // the connection closes, it correctly registers as no longer logged in
        current.conn.close();
    }
}