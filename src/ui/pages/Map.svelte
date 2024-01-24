<script lang="ts" context="module">
    export const MAP_CTX_KEY = Symbol();
</script>

<script lang="ts">
    import IconButton from "../widgets/IconButton.svelte";

    import * as L from "leaflet-lite";
    import "leaflet-lite/styles";
    import { onDestroy, onMount, setContext } from "svelte";
    import Icon from "../widgets/Icon.svelte";

    /**
     * Space-delimited list of classes to add to the map container element.
     */
    let className = "";
    export { className as class };

    // This will not be assigned a value until Svelte calls onMount()...
    let mapContainer: HTMLDivElement;
    // ...which will then allow us to initialize the map instance.
    let map: L.Map;

    let tool: "select" | "add-stop" | "equi-poly" | "rect" | "ellipse" | "polyline" | "polygon" = "select";

    // We cannot use the value of the map variable directly because it will not be
    // created until onMount() is called, which will happen immediately after this
    // code runs.
    setContext(MAP_CTX_KEY, () => map);

    onMount((): void => {
        map = new L.Map(mapContainer, new L.SVG({ padding: 2 }), {
            minZoom: 12,
            maxZoom: 19,
            maxBounds: new L.LatLngBounds(
                new L.LatLng(29.76348328222648, -82.09842681884767),
                new L.LatLng(29.520293014753662, -82.59281158447267),
            ),
            zoom: 12,
            center: new L.LatLng(29.651957244073873, -82.32673645019533),
        });

        new L.Drag(map, { maxBoundsViscosity: 1 });
        L.enableScrollWheelZoom(map);
        L.enableDoubleClickZoom(map);
        new L.TouchZoom(map);
        new L.BoxZoom(map);
        new L.Keyboard(map);
        new L.TapHold(map);

        map.addLayer(
            new L.TileLayer(
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    // TODO: attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 20,
                },
            ),
        );
    });

    onDestroy((): void => {
        map?.dispose();
    });
</script>

<div class="layout">
    <div class="map {className}" bind:this={mapContainer}>
        {#if map}
            <slot />
        {/if}
    </div>
    <div class="map-tools">
        <div class="toolbar" role="toolbar">
            <IconButton
                label="Select"
                icon="cursor"
                color={tool === "select" ? "primary" : undefined}
                on:click={() => tool = "select"}
                pressed={tool === "select"} />
            <IconButton
                label="Create stop"
                icon="bus-stop"
                color={tool === "add-stop" ? "primary" : undefined}
                on:click={() => tool = "add-stop"}
                pressed={tool === "add-stop"} />
            <IconButton
                label="Polyline"
                icon="polyline"
                color={tool === "polyline" ? "primary" : undefined}
                on:click={() => tool = "polyline"}
                pressed={tool === "polyline"} />
            <IconButton
                label="Polygon"
                icon="polygon"
                color={tool === "polygon" ? "primary" : undefined}
                on:click={() => tool = "polygon"}
                pressed={tool === "polygon"} />
            <IconButton
                label="Ellipse"
                icon="ellipse"
                color={tool === "ellipse" ? "primary" : undefined}
                on:click={() => tool = "ellipse"}
                pressed={tool === "ellipse"} />
            <IconButton
                label="Equilateral polygon"
                icon="shapes"
                color={tool === "equi-poly" ? "primary" : undefined}
                on:click={() => tool = "equi-poly"}
                pressed={tool === "equi-poly"} />
            <IconButton
                label="Rectangle"
                icon="rectangle"
                color={tool === "rect" ? "primary" : undefined}
                on:click={() => tool = "rect"}
                pressed={tool === "rect"} />
        </div>

        <!--
            TODO: should be able to select individual point fields in the form,
            and that becomes which point you are re-selecting on the map.
        -->

        {#if tool === "select"}
            <div class="placeholder">
                <Icon
                    name="cursor"
                    color="primary"
                    size={72} />
                <h3>Select Tool</h3>
                <p>
                    Click a stop, polygon, or other feature on the map to view and
                    edit it. Additionally, you can select a set of features by
                    holding <kbd>⌘</kbd> or <kbd>Ctrl</kbd> while you click and
                    drag the mouse on the map.
                </p>
            </div>
        {:else if tool === "add-stop"}
            <div class="placeholder">
                <Icon
                    name="bus-stop"
                    color="primary"
                    size={72} />
                <h3>Create Bus Stop</h3>
                <p>
                    Click on the map to create a new bus stop. A form will appear
                    in this panel, allowing you to configure the stop information,
                    or cancel creation altogether.
                </p>
            </div>
        {:else if tool === "polyline"}
            <div class="placeholder">
                <Icon
                    name="polyline"
                    color="primary"
                    size={72} />
                <h3>Polyline</h3>
                <p>
                    Create/edit polylines on the map. Select 2 or more points on the
                    map to get started, and from there you can select more points or
                    use the tools that will appear here for more fine-grained editing
                    control.
                </p>
            </div>
        {:else if tool === "polygon"}
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
        {:else if tool === "ellipse"}
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
        {:else if tool === "equi-poly"}
            <div class="placeholder">
                <Icon
                    name="shapes"
                    color="primary"
                    size={72} />
                <h3>Equilateral Polygon</h3>
                <p>
                    <!-- TODO: make "polygon" clickable and switch to polygon tool? -->
                    This is a convenience version of the more powerful polygon tool
                    which only allows drawing equilateral polygons. That means you
                    only need to choose a center, number of points, radius, and
                    rotation. (As opposed to configuring all of the point coordinates
                    independently.)
                </p>
            </div>
        {:else if tool === "rect"}
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
        {/if}
    </div>
</div>

<style>
    .layout {
        /* TODO */
        height: 100%;
        display: flex;
    }

    .map {
        height: 100%;
        flex-grow: 1;
        contain: strict;
    }

    .map-tools {
        height: 100%;
        width: 480px;
        border-left: 1px solid #777;
        background-color: #fff;
        contain: strict;
    }

    .toolbar {
        display: flex;
        align-items: center;
        background-color: #eee;
        border-bottom: 1px solid rgba(0, 0, 0, .12);
    }

    kbd {
        font-family: monospace;
        font-weight: 700;
        padding: 2px 6px;
        border: 0.5px solid #777;
        line-height: 1em;
        border-radius: 4px;
        box-shadow: 1px 1px #777;
        background-color: #eee;
        position: relative;
    }
</style>
