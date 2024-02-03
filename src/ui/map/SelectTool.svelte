<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import { PROJECT_FEATURES, deleteCircle, deletePath, deleteStop } from "../../state/project-features";
    import Icon from "../widgets/Icon.svelte";
    import IconButton from "../widgets/IconButton.svelte";

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
    <ul>
        {#each $PROJECT_FEATURES.stops as stop (stop.id)}
            <li>
                {stop.name}
                <IconButton
                    label="Delete"
                    icon="delete"
                    color="warn"
                    on:click={() => deleteStop(stop.id)} />
            </li>
        {/each}
        {#each $PROJECT_FEATURES.paths as path (path.id)}
            <li>
                {path.description}
                <IconButton
                    label="Delete"
                    icon="delete"
                    color="warn"
                    on:click={() => deletePath(path.id)} />
            </li>
        {/each}
        {#each $PROJECT_FEATURES.circles as circle (circle.id)}
            <li>
                {circle.description}
                <IconButton
                    label="Delete"
                    icon="delete"
                    color="warn"
                    on:click={() => deleteCircle(circle.id)} />
            </li>
        {/each}
    </ul>
</div>
