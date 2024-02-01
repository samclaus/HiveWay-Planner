<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import Icon from "../widgets/Icon.svelte";

    export let map: L.Map;

    const line = new L.Polyline([], {
        color: "#000",
        opacity: 0.5,
    });
    const previewLine = new L.Polyline([], {
        color: "#000",
        opacity: 1,
        dashArray: "10 10",
    });

    let coords: L.LatLng[] = [];

    function onMapMousemove({ latlng }: any): void {
        if (coords.length > 0) {
            previewLine.setLatLngs([coords[coords.length - 1], latlng]);
            map.addLayer(previewLine);
        }
    }

    function onMapClick({ latlng }: any): void {
        coords.push(latlng);

        if (coords.length > 1) {
            line.setLatLngs(coords);
            map.addLayer(line);
        }

        coords = coords; // for Svelte
    }

    function onMapMouseout(): void {
        map.removeLayer(previewLine);
    }

    map.on("mousemove", onMapMousemove);
    map.on("click", onMapClick);
    map.on("mouseout", onMapMouseout);

    onDestroy((): void => {
        map.off("mousemove", onMapMousemove);
        map.off("click", onMapClick);
        map.off("mouseout", onMapMousemove);
        map.removeLayer(line);
        map.removeLayer(previewLine);
    });
</script>

{#if coords.length < 1}
    <div class="placeholder">
        <Icon
            name="polyline"
            color="primary"
            size={72} />
        <h3>Polyline</h3>
        <p>
            Create/edit polylines on the map. Select 2 or more points on the
            map to get started, and from there you can select more points or
            use the tools that will appear here for more fine-grained editing
            control.
        </p>
    </div>
{:else}
    <ol>
        {#each coords as { lat, lng }, i (i)}
            <li>{lng}, {lat}</li>
        {/each}
    </ol>
{/if}