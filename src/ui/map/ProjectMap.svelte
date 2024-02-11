<script lang="ts">
    import * as L from "leaflet-lite";
    import "leaflet-lite/styles";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { PROJECT_FEATURES, refreshProjectFeatures } from "../../state/project-features";
    import { RenderCircle, RenderPath, RenderStop } from "../map";

    export let projID: string;
    export let nonInteractive = false;

    // This will not be assigned a value until Svelte calls onMount()...
    let mapContainer: HTMLDivElement;
    // ...which will then allow us to initialize the map instance.
    let map: L.Map;

    const dispatch = createEventDispatcher<{ load: L.Map; }>();

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

        if (!nonInteractive) {
            new L.Drag(map, { maxBoundsViscosity: 1 });
            L.enableScrollWheelZoom(map);
            L.enableDoubleClickZoom(map);
            new L.TouchZoom(map);
            new L.BoxZoom(map);
            new L.Keyboard(map);
            new L.TapHold(map);
        }

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

        dispatch("load", map);
    });

    onDestroy((): void => {
        map?.dispose();
    });
</script>

<div class="project-map" bind:this={mapContainer} />

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

<style>
    div {
        contain: strict;
    }
</style>
