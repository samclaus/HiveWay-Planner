<script lang="ts">
    import * as L from "leaflet-lite";
    import "leaflet-lite/styles";
    import { onDestroy, onMount } from "svelte";
    import { PROJECT_FEATURES, refreshProjectFeatures } from "../../state/project-features";
    import { PROJECTS } from "../../state/projects";
    import { BREADCRUMBS } from "../Breadcrumbs.svelte";
    import { MAP_TOOLS, RenderCircle, RenderPath, RenderStop, type MapTool } from "../map";
    import IconButton from "../widgets/IconButton.svelte";

    export let params: {
        id: string;
    };

    // This will not be assigned a value until Svelte calls onMount()...
    let mapContainer: HTMLDivElement;
    // ...which will then allow us to initialize the map instance.
    let map: L.Map;

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
    $: toolComp = MAP_TOOLS[tool];

    refreshProjectFeatures();

    onMount((): void => {
        map = new L.Map(mapContainer, new L.SVG({ padding: 2 }), {
            minZoom: 12,
            maxZoom: 19,
            maxBounds: new L.LatLngBounds(
                new L.LatLng(29.76348328222648, -82.09842681884767),
                new L.LatLng(29.520293014753662, -82.59281158447267),
            ),
            zoom: 12,
            center: new L.LatLng(29.651957244073873, -82.32673645019533),
        });

        new L.Drag(map, { maxBoundsViscosity: 1 });
        L.enableScrollWheelZoom(map);
        L.enableDoubleClickZoom(map);
        new L.TouchZoom(map);
        new L.BoxZoom(map);
        new L.Keyboard(map);
        new L.TapHold(map);

        map.addLayer(
            new L.TileLayer(
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    // TODO: attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20,
                },
            ),
        );
    });

    onDestroy((): void => {
        map?.dispose();
    });
</script>

<main>
    <div
        class="map"
        style:cursor={tool !== "select" ? "crosshair" : undefined}
        bind:this={mapContainer}>

        {#if map}
            {@const features = $PROJECT_FEATURES}
            {#each features.stops as stop (stop.id)}
                <RenderStop {map} {stop} />
            {/each}
            {#each features.paths as path (path.id)}
                <RenderPath {map} {path} />
            {/each}
            {#each features.circles as circle (circle.id)}
                <RenderCircle {map} {circle} />
            {/each}
        {/if}

    </div>
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
            <svelte:component this={toolComp} {map} />
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
    }

    .map {
        height: 100%;
        flex-grow: 1;
        contain: strict;
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
