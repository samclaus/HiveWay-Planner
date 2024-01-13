
<!-- TODO: is the warning (ignored below) valid for this case? -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="container"
    class:ed-has-value={!!value}
    on:click={containerClicked}>

    <label for={inputID} class:required>
        {label}
    </label>

    <input
        id={inputID}
        type="text"
        {required}
        {maxlength}
        bind:this={inputEl}
        bind:value>

</div>

<script lang="ts" context="module">
    let counter = 0;
</script>

<script lang="ts">
    import { onMount } from "svelte";


    export let label: string;
    export let value: string;
    export let required = false;
    export let maxlength: number | undefined = undefined;
    export let autofocus = false;

    const inputID = `ed-textfield-${counter++}`;

    let inputEl: HTMLInputElement;

    function containerClicked(): void {
        if (document.activeElement !== inputEl) {
            inputEl.select();
        }
    }

    onMount(() => {
        if (autofocus) {
            inputEl.focus();
        }
    });
</script>

<style>
    .container {
        margin: 16px 0;

        padding: 16px 4px 4px;

        position: relative;

        border-radius: 6px 6px 0 0;
        border-bottom: 1px solid darkgray;

        background-color: rgba(#FFF, 0.1);

        cursor: pointer;
    }

    label {
        font-size: 16px;

        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        transform-origin: top left;
        transition: transform 200ms ease-in-out;

        pointer-events: none;
    }
    label.required:after {
        content: "*";
        color: var(--error);
    }

    input {
        background-color: transparent;

        border: none;
        outline: none;

        font-size: 16px;
    }

    input:not(:focus) {
        cursor: inherit;
    }

    .container:focus-within {
        border-bottom: 3px solid var(--primary);
        padding-bottom: 2px;
    }

    .container:focus-within,
    .container.ed-has-value {
        cursor: text;
    }

    .container:focus-within label,
    .container.ed-has-value label {
        transform: scale(60%) translateY(-150%);
    }
</style>