<h2>Request/Response Debugging</h2>
<form on:submit|preventDefault={sendRequest}>
    <h3>Request</h3>
    <div class="form-fields">
        <TextField label="Request Type" bind:value={requestType} autofocus />
        <TextField label="Request JSON" bind:value={requestJSON} />
    </div>
    <div class="form-actions">
        <button type="button" on:click={benchmark}>Benchmark</button>
        <button type="submit" class="filled">Send request</button>
    </div>
</form>
<section class="response-container">
    <h3>Response</h3>
    <pre>{responseText}</pre>
</section>

<script lang="ts">
import { decode, encode } from "msgpack-ts";
import { request } from "../../state/session";
import TextField from "../widgets/TextField.svelte";

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
    request(requestType, encode(parseRequest())).then(
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
    const req = parseRequest();
    const start = performance.now();
    const promises: Promise<unknown>[] = [];
    const results: [unknown, number][] = [];

    for (let i = 0; i < 10_000; ++i) {
        const reqStart = performance.now();
        promises.push(
            request(requestType, encode(req)).then(
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

<style>
    h2 {
        text-align: center;
    }

    form,
    .response-container {
        margin: 100px auto;
        width: 100%;
        max-width: 85ch;
    }

    .response-container {
        padding-bottom: 48px;
    }

    pre {
        padding: 12px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: auto;
    }
</style>