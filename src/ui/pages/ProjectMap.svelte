<script lang="ts">
    import * as L from "leaflet-lite";
    import "leaflet-lite/styles";
    import { onDestroy, onMount } from "svelte";
    import { PROJECTS } from "../../state/projects";
    import { autofocus } from "../actions/autofocus";
    import { MAP_TOOLS, type MapTool } from "../map";
    import IconButton from "../widgets/IconButton.svelte";

    export let params: {
        id: string;
    };

    // This will not be assigned a value until Svelte calls onMount()...
    let mapContainer: HTMLDivElement;
    // ...which will then allow us to initialize the map instance.
    let map: L.Map;

    let tool: MapTool = "select";

    $: projectName = $PROJECTS && PROJECTS.get(params.id)?.name || params.id;
    $: toolComp = MAP_TOOLS[tool];

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

<div class="layout">
    <div
        class="map"
        style:cursor={tool !== "select" ? "crosshair" : undefined}
        bind:this={mapContainer} />
    <div class="map-tools">
        <div class="toolbar sticky">
            <h2 class="flex-grow">{projectName}</h2>
            <div class="select-wrapper">
                <select aria-label="Project navigation" use:autofocus>
                    <option>Edit</option>
                    <option>Collaborators</option>
                    <option>Comments</option>
                </select>
            </div>
        </div>
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
</div>

<style>
    .layout {
        /* TODO */
        height: 100%;
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

    h2 {
        margin: 0;
    }

    .toolbar {
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
    }

    .toolbar.sticky {
        position: sticky;
        top: 0;
        z-index: 1;
        background-color: #fff;
    }

    .toolbar.secondary {
        border: 1px solid rgba(0, 0, 0, .12);
        border-width: 1px 0;
        background-color: #eee;
    }
</style>
