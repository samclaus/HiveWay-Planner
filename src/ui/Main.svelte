<script lang="ts">
    import { decode, encode } from "msgpack-ts";
    import type { TransientBackendConn } from "src/backend/transient-conn";
    import { logout } from "../session";
    import TextField from "./widgets/TextField.svelte";

    export let conn: TransientBackendConn;
    export let firstLogin: boolean;

    $: user = conn.user;

    let requestType = "user:list";
    let requestBody = "";
    let responseText = "";

    function sendRequest(): void {
        conn.send(requestType, encode(requestBody)).then(
            (response) => {
                responseText =
                    "" + JSON.stringify(decode(response), undefined, 4);
            },
            (err) => {
                if (err instanceof Error) {
                    responseText = err.message;
                } else {
                    responseText = JSON.stringify(err, undefined, 4);
                }
            }
        );
    }

    function benchmark(): void {
        const start = performance.now();
        const promises: Promise<unknown>[] = [];
        const results: [unknown, number][] = [];

        for (let i = 0; i < 10_000; ++i) {
            const reqStart = performance.now();
            promises.push(
                conn.send(requestType, encode(requestBody)).then(
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
    <div class="ed-toolbar">
        <span> Dashboard </span>
        <div class="ed-flex-1" />
        <span>
            Logged in as {user.username} (ID: {user.id.substring(0, 6)})
            {#if firstLogin}
                (NEWLY REGISTERED!)
            {/if}
        </span>
        <div class="ed-flex-1" />
        <button class="toolbar-button" on:click={logout}> Logout </button>
    </div>
    <h2>Request/Response Debugging</h2>
    <form on:submit|preventDefault={sendRequest}>
        <h3>Request</h3>
        <TextField label="Request Type" bind:value={requestType} autofocus />
        <TextField label="Request Body" bind:value={requestBody} />
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
