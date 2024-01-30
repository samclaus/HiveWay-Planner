<script lang="ts">
    import { PROJECTS, deleteProject } from "../../state/projects";
    import { USERS, userName } from "../../state/users";
    import { autofocus } from "../actions/autofocus";
    import { cardLink } from "../actions/card-link";
    import ProjectSave from "../modals/ProjectSave.svelte";
    import Icon from "../widgets/Icon.svelte";
    import IconButton from "../widgets/IconButton.svelte";
    import { show } from "../widgets/ModalContainer.svelte";

    const status$ = PROJECTS.status$;

    PROJECTS.forceRefresh();
</script>

<h1>Projects</h1>

{#if $status$.refreshError}
    <p class="legible-width">{$status$.refreshError.message}</p>
{/if}

<ul class="card-grid">
    <li class="card--new">
        <button use:autofocus on:click={() => show(ProjectSave)}>
            <Icon name="plus" size={72} />
            <h3>New Project</h3>
            <p>
                Projects are the bread-and-butter of this application.
                Each project contains a set of stops and routes,
                miscellaneous map geometry (e.g., to display census
                data), and can be published as the main/current GTFS Schedule
                data set for transit consumers.
            </p>
        </button>
    </li>
    {#each ($PROJECTS || []) as proj (proj.id)}
    <li class="card" use:cardLink>
        <h3><a data-card-link href="#/projects/{proj.id}">{proj.name}</a></h3>
        <p class="flex-grow">
            {#if proj.desc}
                {proj.desc}
            {:else}
                <em>No description provided.</em>
            {/if}
        </p>
        <p class="card-field">
            <Icon name="calendar-plus" />
            <!-- TODO -->
            <span>Created <strong>Jan 7</strong> at 5:14pm</span>
        </p>
        <p class="card-field">
            <Icon name="account" />
            <span>Created by <strong>{$USERS && userName(proj.created_by)}</strong></span>
        </p>
        <div class="card-actions">
            <IconButton
                label="Edit"
                icon="edit"
                on:click={() => show(ProjectSave, { proj })} />
            <IconButton
                label="Delete"
                icon="delete"
                color="warn"
                on:click={() => deleteProject(proj.id)} />
        </div>
    </li>
    {/each}
</ul>
