<script lang="ts">
    import { REGISTRATION_TOKENS, deleteRegistrationToken } from "../../state/registration-tokens";
    import { USERS, userName } from "../../state/users";
    import { BREADCRUMBS } from "../Breadcrumbs.svelte";
    import { autofocus } from "../actions/autofocus";
    import RegTokenCreate from "../modals/RegTokenCreate.svelte";
    import Icon from "../widgets/Icon.svelte";
    import IconButton from "../widgets/IconButton.svelte";
    import { show } from "../widgets/ModalContainer.svelte";

    const status$ = REGISTRATION_TOKENS.status$;

    BREADCRUMBS.set([["Registration Tokens", "/registration-tokens"]]);
    REGISTRATION_TOKENS.forceRefresh();

    function copyToken(inputID: string): void {
        const input = document.getElementById(inputID) as HTMLInputElement;
        
        if (input) {
            input.focus();
            input.select();
            document.execCommand("copy");
        }
    }
</script>

<main class="padding-heavy">

    <h1>Registration Tokens</h1>

    {#if $status$.refreshError}
        <p class="legible-width">{$status$.refreshError.message}</p>
    {/if}

    <ul class="card-grid">
        <li class="card--new">
            <button use:autofocus on:click={() => show(RegTokenCreate)}>
                <Icon name="plus" size={72} />
                <h3>New Token</h3>
                <p>
                    Registration tokens are single-use passwords that
                    allow new users to register. Create one and
                    distribute it via email or another secure medium
                    when onboarding a user.
                </p>
            </button>
        </li>
        {#each ($REGISTRATION_TOKENS || []) as token (token.id)}
        <li class="card">
            <h3>{token.name}</h3>
            <p class="flex-grow">
                {#if token.notes}
                    {token.notes}
                {:else}
                    <em>No notes provided.</em>
                {/if}
            </p>
            <p class="card-field">
                <Icon name="badge-account" />
                <span>
                    Will be
                    {#if token.rank}
                        an <strong>admin</strong>
                    {:else}
                        a <strong>normal user</strong>
                    {/if}
                </span>
            </p>
            <p class="card-field">
                <Icon name="calendar-plus" />
                <!-- TODO -->
                <span>Created <strong>Jan 7</strong> at 5:14pm</span>
            </p>
            <p class="card-field">
                <Icon name="account" />
                <span>Created by <strong>{$USERS && userName(token.created_by)}</strong></span>
            </p>
            <div class="card-actions">
                <input id={token.id} type="text" class="monospace" readonly value={token.id}>

                <IconButton
                    label="Delete"
                    icon="delete"
                    color="warn"
                    on:click={() => deleteRegistrationToken(token.id)} />
                <IconButton
                    label="Copy token"
                    icon="copy"
                    color="primary"
                    on:click={() => copyToken(token.id)} />
            </div>
        </li>
        {/each}
    </ul>

</main>
