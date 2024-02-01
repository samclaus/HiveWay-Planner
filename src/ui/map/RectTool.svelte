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
        name="rectangle"
        color="primary"
        size={72} />
    <h3>Rectangle</h3>
    <p>
        <!-- TODO: make "polygon" clickable and switch to polygon tool? -->
        This is a convenience version of the more powerful polygon tool
        which only allows drawing rectangles. That means you only need
        to manage 2 coordinates, or a single coordinate and width/height.
    </p>
</div>
