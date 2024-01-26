<script lang="ts">
    import { USERS, RANK_NAMES, deleteUser } from "../../state/users";
    import IconButton from "../widgets/IconButton.svelte";

    const status$ = USERS.status$;

    USERS.forceRefresh();
</script>

<h1>Users</h1>

{#if $status$.refreshError}
    <p class="legible-width">{$status$.refreshError.message}</p>
{/if}

<ul>
    {#each ($USERS || []) as user (user.id)}
    <li>
        <h3>{user.name}</h3>
        <p>{RANK_NAMES[user.rank]}</p>
        <p>{user.email || '(No email specified.)'}</p>
        <p>{user.id}</p>
        <div class="form-actions">
            <!-- TODO: only show delete button if their rank is lower than ours -->
            <IconButton
                label="Delete"
                icon="delete"
                color="warn"
                on:click={() => deleteUser(user.id)} />
        </div>
    </li>
    {/each}
</ul>

<style>
    ul {
        padding: 0 48px 48px;
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
</style>
