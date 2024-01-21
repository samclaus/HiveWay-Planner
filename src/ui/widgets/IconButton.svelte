<script lang="ts" context="module">
    const colors = {
        primary: "#388E3C",
        warn: "#E53935",
    };
</script>

<script lang="ts">
    /**
     * Value for the aria-label attribute (required for a11y), as
     * well as a visual tooltip in the future (TODO).
     */
    export let label: string;
    /**
     * Name of the SVG icon to use. Must be an ID of a `<symbol>`
     * element in the SVG 'spritesheet' located in `index.html`.
     */
    export let icon: string;
    /**
     * Theme color for the icon. Undefined (default) means a
     * neutral grayscale color (according to light/dark theme)
     * will be used.
     */
    export let color: undefined | "primary" | "warn" = undefined;
</script>

<button on:click aria-label={label} style:color={color && colors[color]}>
    <svg><use xlink:href="#{icon}" /></svg>
</button>

<style>
    button {
        padding: 8px;
        margin: 12px;
        width: 40px;
        height: 40px;
        contain: strict;
        border-radius: 8px;
        cursor: pointer;
        color: #333;
    }

    button:hover {
        background-color: rgba(0, 0, 0, .12);
    }

    svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
    }
</style>