<script lang="ts">
    import { createProject, modifyProjectMetadata, type ProjectInfo } from "../../state/projects";
    import { cancel, complete } from '../widgets/ModalContainer.svelte';
    import TextArea from '../widgets/TextArea.svelte';
    import TextField from '../widgets/TextField.svelte';

    export let proj: ProjectInfo | undefined = undefined;

    let name = '';
    let desc = '';

    if (proj) {
        name = proj.name;
        desc = proj.desc;
    }

    function submit(): void {
        if (proj) {
            modifyProjectMetadata({
                id: proj.id,
                name,
                desc,
            });
        } else {
            createProject({
                name,
                desc,
            });
        }
        complete();
    }
</script>
<form on:submit|preventDefault={submit}>

    <h2>
        {#if proj}
            Update {proj.name}
        {:else}
            Create a new project
        {/if}
    </h2>

    <div class="form-fields">

        <TextField
            label="Name"
            bind:value={name}
            required
            maxlength={100}
            placeholder="e.g. Fall 2023 w/ Detours"
            autofocus />

        <TextArea
            label="Description"
            hint="What is this project for?"
            placeholder=""
            bind:value={desc} />

    </div>

    <div class="form-actions">

        <button type="button" on:click={cancel}>
            Cancel
        </button>

        <button type="submit" class="filled">
            {proj ? "Update" : "Create"} Project
        </button>

    </div>

</form>