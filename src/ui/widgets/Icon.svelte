<script lang="ts" context="module">
    const colors = {
        primary: "#388E3C",
        warn: "#E53935",
    };
</script>

<script lang="ts">
    /**
     * Name of the SVG icon to use. Must be an ID of a `<symbol>`
     * element in the SVG 'spritesheet' located in `index.html`.
     */
    export let name: string;
    /**
     * Theme color for the icon. Undefined (default) means a
     * neutral grayscale color (according to light/dark theme)
     * will be used.
     */
    export let color: undefined | "primary" | "warn" = undefined;
    /**
     * The width/height of the icon, in pixels. Default is 24px;
     */
    export let size = 24;
</script>

<svg
    aria-hidden="true"
    style:color={color && colors[color]}
    style:width={size}
    style:height={size}>
    <use xlink:href="#{name}" />
</svg>

<style>
    svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
    }
</style>