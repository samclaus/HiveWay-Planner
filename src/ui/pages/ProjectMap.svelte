<script lang="ts">
    import * as L from "leaflet-lite";
    import "leaflet-lite/styles";
    import { onDestroy } from "svelte";
    import { PROJECTS } from "../../state/projects";
    import { BREADCRUMBS } from "../Breadcrumbs.svelte";
    import { MAP_TOOLS, ProjectMap, type MapTool } from "../map";
    import IconButton from "../widgets/IconButton.svelte";

    export let params: {
        id: string;
    };

    let map: L.Map | undefined;
    let tool: MapTool = "select";

    $: {
        const
            id = params.id,
            name = $PROJECTS && PROJECTS.get(id)?.name || id;

        $BREADCRUMBS = [
            ["Projects", "/projects"],
            [name, `/projects/${id}`],
            ["Map", `/projects/${id}/map`],
        ];
    }

    onDestroy((): void => {
        map?.dispose();
    });
</script>

<main>
    <ProjectMap
        projID={params.id}
        on:load={ev => map = ev.detail} />

    <div class="map-tools">
        <div class="toolbar secondary" role="toolbar">
            <IconButton
                label="Select"
                icon="cursor"
                color={tool === "select" ? "primary" : undefined}
                on:click={() => tool = "select"}
                pressed={tool === "select"} />
            <IconButton
                label="Create stop"
                icon="bus-stop"
                color={tool === "add-stop" ? "primary" : undefined}
                on:click={() => tool = "add-stop"}
                pressed={tool === "add-stop"} />
            <IconButton
                label="Polyline"
                icon="polyline"
                color={tool === "polyline" ? "primary" : undefined}
                on:click={() => tool = "polyline"}
                pressed={tool === "polyline"} />
            <IconButton
                label="Polygon"
                icon="polygon"
                color={tool === "polygon" ? "primary" : undefined}
                on:click={() => tool = "polygon"}
                pressed={tool === "polygon"} />
            <IconButton
                label="Circle"
                icon="circle"
                color={tool === "circle" ? "primary" : undefined}
                on:click={() => tool = "circle"}
                pressed={tool === "circle"} />
        </div>

        <!--
            TODO: should be able to select individual point fields in the form,
            and that becomes which point you are re-selecting on the map.
        -->
        {#if map}
            <svelte:component this={MAP_TOOLS[tool]} {map} />
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
    }

    main :global(.project-map) {
        height: 100%;
        flex-grow: 1;
    }

    .map-tools {
        height: 100%;
        width: 480px;
        border-left: 1px solid #777;
        background-color: #fff;
        contain: strict;
        overflow-y: auto;
    }
</style>
