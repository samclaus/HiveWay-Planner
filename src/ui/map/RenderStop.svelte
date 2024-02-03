<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import type { StopInfo } from "../../state/project-features";

    export let map: L.Map;
    export let stop: StopInfo;

    const marker = new L.Circle(new L.LatLng(stop.lat, stop.lng), {
        color: "#000",
        weight: 1,
        radius: 5,
    });
    map.addLayer(marker);

    $: marker.setLatLng(new L.LatLng(stop.lat, stop.lng));

    onDestroy(() => map.removeLayer(marker));
</script>