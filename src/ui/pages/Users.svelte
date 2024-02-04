<script lang="ts">
    import { MY_INFO$ } from "../../state/session";
    import { USERS, RANK_NAMES, deleteUser, userName } from "../../state/users";
    import Icon from "../widgets/Icon.svelte";
    import IconButton from "../widgets/IconButton.svelte";
    import { confirm } from "../widgets/ModalContainer.svelte";

    const status$ = USERS.status$;

    USERS.forceRefresh();

    function showDeleteUI(userID: string): void {
        confirm(
            `Delete ${userName(userID)}?`,
            "Deleting a user is a permanent action and cannot be undone.",
            "Delete User",
        ).then(
            () => deleteUser(userID),
        );
    }
</script>

<h1>Users</h1>

{#if $status$.refreshError}
    <p class="legible-width">{$status$.refreshError.message}</p>
{/if}

<ul class="card-grid">
    {#each ($USERS || []) as user (user.id)}
    <li class="card">
        <h3>{user.name}</h3>
        <p class="card-field">
            <Icon name="badge-account" />
            <strong>{RANK_NAMES[user.rank]}</strong>
        </p>
        <p class="card-field">
            <Icon name="atsign" />
            {#if user.email}
                <strong>{user.email}</strong>
            {:else}
                <em>No email provided.</em>
            {/if}
        </p>
        <div class="card-actions">
            {#if $MY_INFO$.rank > user.rank}
                <IconButton
                    label="Delete"
                    icon="delete"
                    color="warn"
                    on:click={() => showDeleteUI(user.id)} />
            {/if}
        </div>
    </li>
    {/each}
</ul>
