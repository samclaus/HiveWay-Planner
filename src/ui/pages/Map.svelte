<script lang="ts" context="module">
    export const MAP_CTX_KEY = Symbol();
</script>

<script lang="ts">
    import * as L from "leaflet-lite";
    import "leaflet-lite/styles";
    import { onDestroy, onMount, setContext } from "svelte";

    /**
     * Space-delimited list of classes to add to the map container element.
     */
    let className = "";
    export { className as class };

    // This will not be assigned a value until Svelte calls onMount()...
    let mapContainer: HTMLDivElement;
    // ...which will then allow us to initialize the map instance.
    let map: L.Map;

    // We cannot use the value of the map variable directly because it will not be
    // created until onMount() is called, which will happen immediately after this
    // code runs.
    setContext(MAP_CTX_KEY, () => map);

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
    <div class="map {className}" bind:this={mapContainer}>
        {#if map}
            <slot />
        {/if}
    </div>
    <div class="map-tools"></div>
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
    }
</style>
