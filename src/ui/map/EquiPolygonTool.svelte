<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import Icon from "../widgets/Icon.svelte";

    export let map: L.Map;

    function onMapClick({ latlng }: any): void {
        // TODO
    }

    map.on("click", onMapClick);
    // TODO

    onDestroy((): void => {
        // TODO
        map.off("click", onMapClick);
    });
</script>

<div class="placeholder">
    <Icon
        name="shapes"
        color="primary"
        size={72} />
    <h3>Equilateral Polygon</h3>
    <p>
        <!-- TODO: make "polygon" clickable and switch to polygon tool? -->
        This is a convenience version of the more powerful polygon tool
        which only allows drawing equilateral polygons. That means you
        only need to choose a center, number of points, radius, and
        rotation. (As opposed to configuring all of the point coordinates
        independently.)
    </p>
</div>
