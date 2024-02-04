<script lang="ts">
    import { autofocus } from '../actions/autofocus';
    import { cancel, complete } from '../widgets/ModalContainer.svelte';
    
    export let title: string;
    export let body: string;
    export let confirmLabel: string;
</script>
<form on:submit|preventDefault={() => complete()}>

    <h2>
        {title}
    </h2>

    <p>
        {body}
    </p>

    <div class="form-actions">

        <button type="button" on:click={cancel} use:autofocus>
            Cancel
        </button>

        <button type="submit" class="filled warn">
            {confirmLabel}
        </button>

    </div>

</form>