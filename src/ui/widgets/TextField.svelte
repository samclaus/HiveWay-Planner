
<label for={inputID}>

    {label}

    {#if !required}
        <span class="faded">(Optional)</span>
    {/if}

    <input
        id={inputID}
        type="text"
        {required}
        {maxlength}
        bind:this={inputEl}
        bind:value>

</label>

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

    const inputID = `hw-textfield-${counter++}`;

    let inputEl: HTMLInputElement;

    onMount(() => {
        if (autofocus) {
            inputEl.focus();
        }
    });
</script>
