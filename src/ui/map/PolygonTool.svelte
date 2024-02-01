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
        Polygons may have 0 or more <em>holes</em> configured. Holes may
        can be of any shape, and you have all of the ordinary shape
        creation tools at your disposal to customize them.
    </p>
</div>
