<script lang="ts">
    import { Rank } from "../../backend/user";
    import { createRegistrationToken } from "../../state/registration-tokens";
    import { MY_INFO$ } from "../../state/session";
    import Checkbox from "../widgets/Checkbox.svelte";
    import { cancel, complete } from '../widgets/ModalContainer.svelte';
    import TextArea from '../widgets/TextArea.svelte';
    import TextField from '../widgets/TextField.svelte';

    let name = '';
    let id = '';
    let admin = false;
    let notes = '';

    function submit(): void {
        createRegistrationToken({
            id,
            name,
            rank: admin ? 1 : 0,
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
            label="Name"
            hint="The user you are onboarding; this name will be associated with the account that is created using this token, but they can change their name later"
            bind:value={name}
            required
            maxlength={100}
            placeholder="e.g. John Doe"
            autofocus />

        <TextField
            label="Token"
            hint="This is the secret password you will send to the user you are onboarding"
            bind:value={id}
            required
            maxlength={100}
            placeholder="e.g. squinting-black-squid-419" />

        {#if $MY_INFO$?.rank > Rank.Admin}
            <Checkbox label="Make Administrator&mdash;CAUTION" bind:value={admin}>
                <p>
                    The user who registers with this token will be given
                    administrator rank, and all the privileges that come
                    with it.
                </p>
                <p>
                    Only you can make new administrators, because you are
                    the root user. Existing administrators will not be
                    able to see or interact with this token.
                </p>
            </Checkbox>
        {/if}

        <TextArea
            label="Notes"
            hint="Any useful information that helps you and other admins manage the tokens"
            placeholder="e.g. Make sure John has completed the standard employee agreement prior to registration."
            bind:value={notes} />

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