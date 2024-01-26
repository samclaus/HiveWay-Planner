
<label for={inputID}>

    {label}

    {#if !required}
        <span class="faded">(Optional)</span>
    {/if}

    <textarea
        id={inputID}
        {required}
        {maxlength}
        {placeholder}
        bind:this={inputEl}
        bind:value></textarea>

    <div class="input-helpers">
        <div class="input-hint">{hint || ""}</div>
        <div>
            {(value?.length || 0) + (maxlength ? "/" + maxlength : "")}
        </div>
    </div>

</label>

<script lang="ts" context="module">
    let counter = 0;
</script>

<script lang="ts">
    import { onMount } from "svelte";

    export let label: string;
    export let hint: string | undefined = undefined;
    export let value: string | undefined;
    export let required = false;
    export let maxlength: number | undefined = undefined;
    export let placeholder: string | undefined = undefined;
    export let autofocus = false;

    const inputID = `hw-textarea-${counter++}`;

    let inputEl: HTMLTextAreaElement;

    onMount(() => {
        if (autofocus) {
            inputEl.focus();
        }
    });
</script>
