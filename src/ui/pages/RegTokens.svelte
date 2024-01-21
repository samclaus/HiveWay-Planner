<script lang="ts">
    import { REGISTRATION_TOKENS, deleteRegistrationToken } from "../../state/registration-tokens";
    import RegTokenCreate from "../modals/RegTokenCreate.svelte";
    import Icon from "../widgets/Icon.svelte";
    import IconButton from "../widgets/IconButton.svelte";
    import { show } from "../widgets/ModalContainer.svelte";

    const status$ = REGISTRATION_TOKENS.status$;
</script>

<h1>Registration Tokens</h1>

{#if $status$.refreshError}
    <p class="legible-width">{$status$.refreshError.message}</p>
{/if}

<ul>
    <li class="new">
        <button on:click={() => show(RegTokenCreate)}>
            <Icon name="plus" size={72} />
            New Token
        </button>
    </li>
    {#each ($REGISTRATION_TOKENS || []) as token}
    <li>
        <h3>{token.id}</h3>
        <p>New account will be {token.role ? 'an admin' : 'a normal user'}.</p>
        <p>Created at {new Date(token.created_at)}</p>
        <p>Created by {token.created_by}</p>
        <p>{token.notes}</p>
        <IconButton
            label="Delete"
            icon="delete"
            color="warn"
            on:click={() => deleteRegistrationToken(token.id)} />
    </li>
    {/each}
</ul>

<style>
    ul {
        padding: 0 48px;
        list-style: none;
        max-width: 100vw;
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-auto-rows: min-content;
        /* grid-auto-flow: column; */
        place-items: stretch;
    }

    li {
        border-radius: 12px;
        border: 2px solid #777;
        padding: 0 12px;
        margin: 0;
        background-color: white;
    }

    li.new {
        position: relative;
        border: 2px dashed #777;
        background-color: transparent;
        min-height: 200px;
    }

    li.new > button {
        position: absolute;
        inset: 0;
        font-size: 2rem;
        color: #777;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border: none;
    }

    li.new > button:hover {
        background-color: rgba(0, 0, 0, .12);
    }
</style>
