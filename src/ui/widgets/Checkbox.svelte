
<label for={inputID}>

    <input
        id={inputID}
        type="checkbox"
        {required}
        bind:this={inputEl}
        bind:checked={value}>

    <div class="label-text">
        {label}

        {#if required}
            <span class="faded">(REQUIRED)</span>
        {/if}

        <slot />
    </div>

</label>

<script lang="ts" context="module">
    let counter = 0;
</script>

<script lang="ts">
    import { onMount } from "svelte";

    export let label: string;
    export let value: boolean;
    export let required = false;
    export let autofocus = false;

    const inputID = `hw-checkbox-${counter++}`;

    let inputEl: HTMLInputElement;

    onMount(() => {
        if (autofocus) {
            inputEl.focus();
        }
    });
</script>

<style>
    label {
        border: 2px solid #777;
        border-radius: 8px;
        padding: 0 12px;
        display: flex;
        align-items: flex-start;
        cursor: pointer;
        user-select: none;
    }

    label:focus-within {
        border-color: #4CAF50;
    }

    label :global(p) {
        margin: 0.5em 0;
    }

    input {
        margin-top: .75em;
        min-width: 1em;
        width: 1em;
        height: 1em;
        display: inline-block;
    }

    input:checked {
        accent-color: #00E676;
    }

    .label-text {
        flex-grow: 1;
        margin: 0.5em 0;
    }
</style>
