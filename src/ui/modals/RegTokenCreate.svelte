<script lang="ts">
    import type { TransientBackendConn } from "@backend/transient-conn";
    import { complete } from '../widgets/ModalContainer.svelte';
    import TextField from '../widgets/TextField.svelte';
    import { encode } from "msgpack-ts";

    export let conn: TransientBackendConn;

    let id = '';
    let admin = false;
    let notes = '';

    function submit(): void {
        conn.sendIgnoreReply('registration_token:create', encode({
            id,
            role: admin ? 1 : 0,
            notes,
        }));
        complete();
    }
</script>
<form on:submit|preventDefault={submit}>

    <h2>Create a new registration token</h2>

    <TextField label="Token" bind:value={id} required maxlength={100} />

    <label>
        <input type="checkbox" bind:value={admin}>
        This user should be an administrator
    </label>

    <label>
        Notes
        <textarea bind:value={notes}></textarea>
    </label>

    <button type="submit">
        Create Token
    </button>

</form>