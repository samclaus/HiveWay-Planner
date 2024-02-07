<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import { createCircle } from "../../state/project-features";
    import Icon from "../widgets/Icon.svelte";
    import GeometryFields from "./GeometryFields.svelte";
    import { defaultGeometryStyles } from "./core";

    export let map: L.Map;

    let name = "";
    let styles = defaultGeometryStyles();

    const circle = new L.Circle(new L.LatLng(0, 0), {
        ...styles,
        interactive: false,
    });

    let center: L.LatLng | undefined;
    let radiusMeters = 100;

    $: circle.setRadius(radiusMeters);
    $: circle.setStyle(styles);

    function onMapClick({ latlng }: any): void {
        center = latlng as L.LatLng;
        circle.setLatLng(center);
        map.addLayer(circle);
    }

    map.on("click", onMapClick);

    onDestroy((): void => {
        map.removeLayer(circle);
        map.off("click", onMapClick);
    });

    function cancel(): void {
        map.removeLayer(circle);
        center = undefined;
    }

    function submit(): void {
        if (!center) {
            return;
        }
    
        // TODO: async handling w/ task system
        createCircle({
            center: [center.lat, center.lng],
            radius_meters: radiusMeters,
            name,
            styles,
        }).then(
            cancel,
            console.error,
        );
    }
</script>

{#if center}
    <form on:submit|preventDefault={submit}>
        <h3>Create Circle</h3>
        <div class="form-fields">

            <label>
                Radius (Meters)
                <input type="number" bind:value={radiusMeters} step="1">
            </label>

            <GeometryFields bind:name bind:styles />

        </div>
        <div class="form-actions">
            <button type="button" on:click={cancel}>
                Cancel
            </button>
            <button type="submit" class="filled">
                Create Circle
            </button>
        </div>
    </form>
{:else}
    <div class="placeholder">
        <Icon
            name="circle"
            color="primary"
            size={72} />
        <h3>Circle</h3>
        <p>
            Click on the map to determine an initial center for the circle.
            From there, you can edit the radius.
        </p>
    </div>
{/if}
