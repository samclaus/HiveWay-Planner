<script lang="ts">
    import type { GeometryStyles } from "../../state/project-features";
    import Checkbox from "../widgets/Checkbox.svelte";
    import TextField from "../widgets/TextField.svelte";

    export let name: string;
    export let styles: GeometryStyles;
    export let strokeOnly = false;

    let singleColor = true;
    let fillColor = styles.fillColor || styles.color;
    let fillOpacity = Math.round(styles.fillOpacity * 100);

    $: {
        styles.fillColor = singleColor ? undefined : fillColor;
        styles.fillOpacity = fillOpacity / 100;
    }
</script>
    
<TextField
    label="Name"
    hint="What does this geometry represent?"
    required
    bind:value={name} />

{#if !strokeOnly}
    <Checkbox label="Stroke/fill using same color" bind:value={singleColor} />
    <Checkbox label="Stroke enabled" bind:value={styles.stroke} />
    <Checkbox label="Fill enabled" bind:value={styles.fill} />
{/if}

<label>
    {singleColor ? "" : "Stroke "}Color
    <input type="color" bind:value={styles.color} />
</label>

{#if !singleColor}
    <label>
        Fill Color
        <input type="color" bind:value={fillColor} />
    </label>
{/if}

{#if styles.stroke}
    <label>
        {strokeOnly ? "" : "Stroke "}Width (Pixels)
        <input type="number" bind:value={styles.weight} min="1" max="20" step="1">
    </label>
{/if}

{#if styles.fill}
    <label>
        Fill Opacity (%)
        <input type="number" bind:value={fillOpacity} min="0" max="100" step="1">
    </label>
{/if}