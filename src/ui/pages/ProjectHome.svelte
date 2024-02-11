<script lang="ts">
    import "leaflet-lite/styles";
    import { PROJECTS, type ProjectInfo } from "../../state/projects";
    import { BREADCRUMBS } from "../Breadcrumbs.svelte";
    import { ProjectMap } from "../map";
    import Icon from "../widgets/Icon.svelte";

    export let params: {
        id: string;
    };

    let proj: ProjectInfo | undefined;

    $: proj = $PROJECTS && PROJECTS.get(params.id);
    $: projName = proj ? proj.name : params.id;
    $: BREADCRUMBS.set([
        ["Projects", "/projects"],
        [projName, `/projects/${params.id}`],
    ]);
</script>

<main class="padding-heavy">

    <h1>{projName}</h1>

    <div class="glance-layout">
        <a class="map-link flex-grow" href="#/projects/{params.id}/map">
            <ProjectMap projID={params.id} nonInteractive />
        </a>
        <div class="glance-stats">
            <p class="flex-grow">
                {#if proj?.desc}
                    {proj.desc}
                {:else}
                    <em>No description provided.</em>
                {/if}
            </p>
            <a class="stats-item" href="#/projects/{params.id}/stops">
                <Icon name="bus-stop" />
                <span><strong>146</strong> stops</span>
            </a>
            <a class="stats-item" href="#/projects/{params.id}/routes">
                <Icon name="bus-route" />
                <span><strong>57</strong> routes</span>
            </a>
            <a class="stats-item" href="#/projects/{params.id}/routes">
                <Icon name="calendar-multiselect" />
                <span><strong>264</strong> days of service</span>
            </a>
            <a class="stats-item warn" href="#/projects/{params.id}/fare">
                <Icon name="currency-off" />
                <span>No fare information</span>
            </a>
            <div class="flex-grow" />
            <button>Edit name/description</button>
            <button>Prepare GTFS ZIP</button>
        </div>
    </div>

    <div class="readme">
        <h2>Lorem Ipsum</h2>
        <p>
            Maxime quo aut quas voluptates a. Quibusdam molestias sed et fugit. Molestiae et quo quis quod facere ducimus. Sit nesciunt quis eos expedita voluptatem voluptate. Consequatur dolorem architecto consequatur rem quibusdam velit velit assumenda.
        </p>
        <p>
            Voluptatum aut perferendis ut non fugit aliquid. Aliquid natus repellendus cum non ipsam minus ad odio. Aut cupiditate eos voluptatibus delectus ut distinctio. Consequatur ut quam voluptatibus optio dolores voluptatum qui ut. Accusamus dicta voluptatem qui.
        </p>
    </div>

</main>

<style>
    main {
    }

    .glance-layout {
        margin: 24px 0;
        display: flex;
        min-height: 480px;
        align-items: stretch;
    }

    .map-link {
        border-radius: 6px;
        border: 2px solid #333;
        contain: strict;
    }

    .map-link :global(.project-map) {
        width: 100%;
        height: 100%;
        min-height: 480px;
        pointer-events: none;
    }

    .glance-stats {
        flex-grow: 2;
        max-width: 32ch;
        display: flex;
        flex-direction: column;
    }

    .glance-stats > p,
    .stats-item {
        padding: 8px 12px;
        margin: 0;
    }

    .stats-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1E88E5;
        font-size: 1.5rem;
        text-decoration: none;
    }

    .stats-item.warn {
        color: #E53935;
    }

    .stats-item:hover {
        text-decoration: underline;
    }

    .glance-stats > button {
        margin: 8px;
    }

    .readme {
        max-width: 100ch;
    }
</style>