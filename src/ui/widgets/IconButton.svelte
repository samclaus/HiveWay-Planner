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
    /**
     * True/false to designate this button as a "toggle button" and mark
     * it as pressed/unpressed accordingly. Useful for radio-button-esque
     * toolbars. For normal buttons, this should be undefined (the default).
     */
    export let pressed: boolean | undefined = undefined;
</script>

<button
    on:click
    style:color={color && colors[color]}
    aria-label={label}
    aria-pressed={pressed}>
    <svg><use xlink:href="#{icon}" /></svg>
</button>

<style>
    button {
        padding: 8px;
        margin: 12px;
        width: 42px;
        height: 42px;
        contain: strict;
        border-radius: 8px;
        border: 1px solid transparent;
        cursor: pointer;
        color: #333;
    }

    button:hover {
        background-color: rgba(0, 0, 0, .12);
    }

    button:focus-visible {
        border-color: #333;
    }

    svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
    }
</style>