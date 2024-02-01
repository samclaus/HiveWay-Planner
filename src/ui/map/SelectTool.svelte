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
        name="cursor"
        color="primary"
        size={72} />
    <h3>Select Tool</h3>
    <p>
        Click a stop, polygon, or other feature on the map to view and
        edit it. You can select a set of features by holding <kbd>⌘</kbd>
        or <kbd>Ctrl</kbd> while you click and drag the mouse on the map.
    </p>
</div>
