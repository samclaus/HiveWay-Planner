<script lang="ts">
    import { USERS, deleteUser } from "../../state/users";
    import IconButton from "../widgets/IconButton.svelte";

    const status$ = USERS.status$;
</script>

<h1>Users</h1>

{#if $status$.refreshError}
    <p class="legible-width">{$status$.refreshError.message}</p>
{/if}

<ul>
    {#each ($USERS || []) as user (user.id)}
    <li>
        <h3>{user.name}</h3>
        <p>{user.role ? 'Admin' : 'Normal User'}.</p>
        <p>{user.email || '(No email specified.)'}</p>
        <p>{user.username}</p>
        <p>{user.id}</p>
        <IconButton
            label="Delete"
            icon="delete"
            color="warn"
            on:click={() => deleteUser(user.id)} />
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
