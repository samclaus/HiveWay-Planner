<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import { createPath } from "../../state/project-features";
    import Icon from "../widgets/Icon.svelte";
    import GeometryFields from "./GeometryFields.svelte";
    import { defaultGeometryStyles } from "./core";

    export let map: L.Map;

    let name = "";
    let styles = defaultGeometryStyles();
    styles.weight = 5;
    styles.fill = false;

    const line = new L.Polyline([], {
        color: "#000",
        opacity: 0.7,
    });
    const previewLine = new L.Polyline([], {
        color: "#000",
        opacity: 1,
        dashArray: "10 10",
    });

    let coords: L.LatLng[] = [];

    $: line.setStyle(styles);
    $: previewLine.setStyle({ weight: styles.weight });

    function onMapMousemove({ latlng }: any): void {
        if (coords.length > 0) {
            previewLine.setLatLngs([coords[coords.length - 1], latlng]);
            map.addLayer(previewLine);
        }
    }

    function onMapClick({ latlng }: any): void {
        coords.push(latlng);
        line.addLatLng(latlng);

        if (coords.length > 1) {
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

    function cancel(): void {
        map.removeLayer(previewLine);
        map.removeLayer(line);
        line.setLatLngs([]);

        coords.length = 0;
        coords = coords; // for Svelte
    }

    function submit(): void {
        // TODO: async handling w/ task system
        createPath({
            line: true,
            coords: coords.flatMap(c => [c.lat, c.lng]),
            name,
            styles,
        }).then(
            cancel,
            console.error,
        );
    }
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
    <form on:submit|preventDefault={submit}>
        <h3>Create Polyline</h3>
        <div class="form-fields">

            <GeometryFields bind:name bind:styles strokeOnly />

        </div>
        <div class="form-actions">
            <button type="button" on:click={cancel}>
                Cancel
            </button>
            <button type="submit" class="filled">
                Create Polyline
            </button>
        </div>
    </form>
{/if}