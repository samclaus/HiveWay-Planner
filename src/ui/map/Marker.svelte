<script lang="ts">
    import * as L from "leaflet-lite";
    import blueMarkerURL from "leaflet-lite/assets/marker.svg";
    import { getContext, onDestroy } from "svelte";
    import { MAP_CTX_KEY } from "./MAP_CTX_KEY";

    export let lat: number;
    export let lng: number;

    const map = getContext<() => L.Map>(MAP_CTX_KEY)();
    const marker = new L.Marker(
        new L.LatLng(lat, lng),
        L.defaultMarkerIcon(blueMarkerURL),
    );

    map.addLayer(marker);

    $: marker.setLatLng(new L.LatLng(lat, lng));

    onDestroy(() => map.removeLayer(marker));
</script>