<script lang="ts">
    import { decode, encode } from "msgpack-ts";
    import type { TransientBackendConn } from "@backend/transient-conn";
    import { logout } from "../session";
    import TextField from "./widgets/TextField.svelte";

    export let conn: TransientBackendConn;
    export let firstLogin: boolean;

    $: user = conn.user;

    let requestType = "user:list";
    let requestJSON = "";
    let responseText = "";

    function parseRequest(): any {
        try {
            return JSON.parse(requestJSON);
        } catch {
            return requestJSON;
        }
    }

    function sendRequest(): void {
        conn.send(requestType, encode(parseRequest())).then(
            res => {
                responseText = "";
                
                if (res.length) {
                    responseText += JSON.stringify(decode(res), undefined, 4);
                }
            },
            err => {
                if (err instanceof Error) {
                    responseText = err.message;
                } else {
                    responseText = JSON.stringify(err, undefined, 4);
                }
            }
        );
    }

    function benchmark(): void {
        const request = parseRequest();
        const start = performance.now();
        const promises: Promise<unknown>[] = [];
        const results: [unknown, number][] = [];

        for (let i = 0; i < 10_000; ++i) {
            const reqStart = performance.now();
            promises.push(
                conn.send(requestType, encode(request)).then(
                    res => {
                        const decoded = decode(res);
                        results.push([decoded, performance.now() - reqStart]);
                    },
                    err => {
                        results.push([err, performance.now() - reqStart]);
                    },
                ),
            );
        }

        Promise.allSettled(promises).finally(
            () => {
                const avgReq = results.reduce((acc, [, reqMS]) => acc + reqMS, 0) / results.length;
                console.log(`Average request took ${Math.round(avgReq)}ms`);
                console.log(`Benchmark took ${performance.now() - start}ms`);
            }
        );
    }

    sendRequest();
</script>

<main>
    <div class="hw-toolbar">
        <span> Dashboard </span>
        <div class="flex-grow" />
        <span>
            Logged in as {user.username} (ID: {user.id.substring(0, 6)})
            {#if firstLogin}
                (NEWLY REGISTERED!)
            {/if}
        </span>
        <div class="flex-grow" />
        <button class="toolbar-button" on:click={logout}> Logout </button>
    </div>
    <h2>Request/Response Debugging</h2>
    <form on:submit|preventDefault={sendRequest}>
        <h3>Request</h3>
        <TextField label="Request Type" bind:value={requestType} autofocus />
        <TextField label="Request JSON" bind:value={requestJSON} />
        <button type="submit">Send request</button>
        <button type="button" on:click={benchmark}>Benchmark</button>
    </form>
    <section class="response-container">
        <h3>Response</h3>
        <pre>{responseText}</pre>
    </section>
</main>

<style>
    .toolbar-button {
        padding: 4px 8px;
    }

    h2 {
        text-align: center;
    }

    form,
    .response-container {
        width: 50%;
        min-width: 400px;

        margin: 100px auto;
    }

    pre {
        padding: 12px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: auto;
    }
</style>
