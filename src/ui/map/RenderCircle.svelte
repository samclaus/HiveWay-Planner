<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import type { CircleInfo } from "../../state/project-features";

    export let map: L.Map;
    export let circle: CircleInfo;

    const layer = new L.Circle(new L.LatLng(...circle.center), circle.styles);
    map.addLayer(layer);

    $: layer.setLatLng(new L.LatLng(...circle.center));
    $: layer.setRadius(circle.radius_meters);
    $: layer.setStyle(circle.styles);

    onDestroy(() => map.removeLayer(layer));
</script>