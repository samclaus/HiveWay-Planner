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
        name="ellipse"
        color="primary"
        size={72} />
    <h3>Ellipse</h3>
    <p>
        Click on the map to determine an initial center for the ellipse.
        From there, you can edit the width/height and rotate it.
    </p>
</div>
