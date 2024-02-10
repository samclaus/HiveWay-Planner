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

    const polygon = new L.Polygon([], { opacity: 1 });
    const previewLine = new L.Polyline([], {
        color: "#000",
        opacity: 1,
        dashArray: "10 10",
    });

    let coords: L.LatLng[] = [];

    $: polygon.setStyle(styles);
    $: previewLine.setStyle({ weight: styles.weight });

    function onMapMousemove({ latlng }: any): void {
        if (coords.length > 0) {
            previewLine.setLatLngs([coords[coords.length - 1], latlng]);
            map.addLayer(previewLine);
        }
    }

    function onMapClick({ latlng }: any): void {
        coords.push(latlng);
        polygon.addLatLng(latlng);

        if (coords.length > 1) {
            map.addLayer(polygon);
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
        map.removeLayer(polygon);
        map.removeLayer(previewLine);
    });

    function onColorInput(ev: any): void {
        polygon.setStyle({ color: ev.target.value });
    }

    function cancel(): void {
        map.removeLayer(previewLine);
        map.removeLayer(polygon);
        polygon.setLatLngs([]);

        coords.length = 0;
        coords = coords; // for Svelte
    }

    function submit(): void {
        // TODO: async handling w/ task system
        createPath({
            line: false,
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
            name="polygon"
            color="primary"
            size={72} />
        <h3>Polygon</h3>
        <p>
            Create/edit polygons on the map. Select 3 or more points on the
            map to get started, and from there you can select more points or
            use the tools that will appear here for more fine-grained editing
            control.
        </p>
        <p>
            Polygons may have 0 or more <em>holes</em> configured. Holes are
            also polygons, and you have all of the ordinary tools at your
            disposal to customize them.
        </p>
    </div>
{:else}
    <div class="toolbar sticky">
        <h2>Creating Polygon</h2>
    </div>
    <form on:submit|preventDefault={submit}>
        <div class="form-fields">

            <GeometryFields bind:name bind:styles />

        </div>
        <div class="form-actions">
            <button type="button" on:click={cancel}>
                Cancel
            </button>
            <button type="submit" class="filled">
                Create Polygon
            </button>
        </div>
    </form>
{/if}
