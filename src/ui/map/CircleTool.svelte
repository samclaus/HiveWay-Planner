<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import Icon from "../widgets/Icon.svelte";

    export let map: L.Map;

    const circle = new L.Circle(new L.LatLng(0, 0), {
        color: "#000",
        fillColor: "#000",
    });

    let center: L.LatLng | undefined;
    let radiusMeters = 20;

    $: circle.setRadius(radiusMeters);

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

    function onColorInput(ev: any): void {
        const color = ev.target.value;

        circle.setStyle({
            color,
            fillColor: color,
        });
    }

    function cancel(): void {
        map.removeLayer(circle);
        center = undefined;
    }

    function createCircle(): void {

    }
</script>

{#if center}
    <form on:submit|preventDefault={createCircle}>
        <h3>Create Circle</h3>
        <div class="form-fields">

            <label>
                Radius (Meters)
                <input type="number" bind:value={radiusMeters} step="1">
            </label>

            <label>
                Color
                <input type="color" value="#000" on:input={onColorInput} />
            </label>

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
