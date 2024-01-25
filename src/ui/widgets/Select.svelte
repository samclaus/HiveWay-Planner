
<label for={selectID}>

    {label}

    {#if !required}
        <span class="faded">(Optional)</span>
    {/if}

    <div class="select-wrapper">
        <select
            id={selectID}
            {required}
            bind:this={selectEl}
            bind:value>
            <slot />
        </select>
    </div>

</label>

<script lang="ts" context="module">
    let counter = 0;
</script>

<script lang="ts">
    import { onMount } from "svelte";

    export let label: string;
    export let value: any;
    export let required = false;
    export let autofocus = false;

    const selectID = `hw-select-${counter++}`;

    let selectEl: HTMLSelectElement;

    onMount(() => {
        if (autofocus) {
            selectEl.focus();
        }
    });
</script>
