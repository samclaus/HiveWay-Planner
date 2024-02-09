<script lang="ts">
    import * as L from "leaflet-lite";
    import { onDestroy } from "svelte";
    import { PROJECT_FEATURES, deleteCircle, deletePath, deleteStop } from "../../state/project-features";
    import Icon from "../widgets/Icon.svelte";
    import IconButton from "../widgets/IconButton.svelte";

    export let map: L.Map;

    const enum FeatureType {
        Stop,
        Polyline,
        Polygon,
        Circle,
    }
    const FEATURE_TYPES: { readonly [Type in FeatureType]: string } = [
        "Stop",
        "Polyline",
        "Polygon",
        "Circle",
    ];
    type FeatureModel = [FeatureType, string, string];

    let features: FeatureModel[] = [];

    $: {
        const f = $PROJECT_FEATURES;

        features.length = 0; // TODO: does this cause additional Svelte work?

        for (const s of f.stops) {
            features.push([FeatureType.Stop, s.id, s.name]);
        }
        for (const p of [...f.paths].sort((l, r) => (+l.line) - (+r.line))) {
            features.push([
                p.line ? FeatureType.Polyline : FeatureType.Polygon,
                p.id,
                p.name,
            ]);
        }
        for (const c of f.circles) {
            features.push([FeatureType.Circle, c.id, c.name]);
        }

        features = features;
    };

    function onMapClick({ latlng }: any): void {
        // TODO
    }

    function onDeleteClick(type: FeatureType, id: string): void {
        // TODO: error handling
        if (type === FeatureType.Stop) {
            deleteStop(id);
        } else if (type === FeatureType.Polyline || type === FeatureType.Polygon) {
            deletePath(id);
        } else if (type === FeatureType.Circle) {
            deleteCircle(id);
        }
    }

    map.on("click", onMapClick);
    // TODO

    onDestroy((): void => {
        // TODO
        map.off("click", onMapClick);
    });
</script>

{#if !features.length}
<div class="placeholder">
    <Icon
        name="cursor"
        color="primary"
        size={72} />
    <h3>Nothing to Select</h3>
    <p>
        This project does not contain any map features yet. Try using one
        of the tools above to create some stops or geometry on the map.
    </p>
</div>
{:else}
<div class="padding">
    <p>
        Click a stop, polygon, or other feature on the map to view and
        edit it. You can select a set of features by holding <kbd>⌘</kbd>
        or <kbd>Ctrl</kbd> while you click and drag the mouse on the map.
        Or you can select features below.
    </p>
    <ul>
        {#each features as [type, id, name] (id)}
            <li class="card">
                <h3>{name}</h3>
                <h4>{FEATURE_TYPES[type]}</h4>
                <div class="card-actions">
                    <IconButton
                        label="Delete"
                        icon="delete"
                        color="warn"
                        on:click={() => onDeleteClick(type, id)} />
                </div>
            </li>
        {/each}
    </ul>
</div>
{/if}

<style>
    .padding {
        padding: 0 48px;
    }

    ul {
        padding: 0;
    }

    li {
        margin: 24px 0;
    }
</style>
