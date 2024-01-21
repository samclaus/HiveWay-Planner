<script lang="ts">
    import { createRegistrationToken } from "../../state/registration-tokens";
    import { cancel, complete } from '../widgets/ModalContainer.svelte';
    import TextField from '../widgets/TextField.svelte';

    let id = '';
    let admin = false;
    let notes = '';

    function submit(): void {
        createRegistrationToken({
            id,
            role: admin ? 1 : 0,
            notes,
        });
        complete();
    }
</script>
<form on:submit|preventDefault={submit}>

    <h2>Create a new registration token</h2>

    <p>
        Once you create a registration token, you must give it to
        the person you are onboarding into the system so they can
        register.
    </p>

    <div class="form-fields">

        <TextField
            label="Token"
            bind:value={id}
            required
            maxlength={100}
            autofocus />

        <label>
            <input type="checkbox" bind:value={admin}>
            This user should be an administrator
        </label>

        <label>
            Notes
            <textarea bind:value={notes}></textarea>
        </label>

    </div>

    <div class="form-actions">

        <button type="button" on:click={cancel}>
            Cancel
        </button>

        <button type="submit" class="filled">
            Create Token
        </button>

    </div>

</form>