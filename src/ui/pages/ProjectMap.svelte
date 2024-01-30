<script lang="ts">
    import * as L from "leaflet-lite";
    import "leaflet-lite/styles";
    import { onDestroy, onMount, setContext } from "svelte";
    import { PROJECTS } from "../../state/projects";
    import { STOP_TYPES, StopType, WheelchairBoarding, type StopSpec } from "../../state/stops";
    import { autofocus } from "../actions/autofocus";
    import { MAP_CTX_KEY } from "../map/MAP_CTX_KEY";
    import Marker from "../map/Marker.svelte";
    import Icon from "../widgets/Icon.svelte";
    import IconButton from "../widgets/IconButton.svelte";
    import Select from "../widgets/Select.svelte";
    import TextArea from "../widgets/TextArea.svelte";
    import TextField from "../widgets/TextField.svelte";

    export let params: {
        id: string;
    };

    // This will not be assigned a value until Svelte calls onMount()...
    let mapContainer: HTMLDivElement;
    // ...which will then allow us to initialize the map instance.
    let map: L.Map;

    // TODO: there can be multiple concurrent mapping projects that they can work
    // on independently
    let projectName = PROJECTS.get(params.id)?.name || "(Unknown Project)";
    let tool: "select" | "add-stop" | "equi-poly" | "rect" | "ellipse" | "polyline" | "polygon" = "select";
    let selectedID: string | undefined;
    let stopSpec: StopSpec | undefined;

    $: if (stopSpec?.type === StopType.Station) {
        stopSpec.parent_station = undefined;
    }

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

        const polyPoints: any[] = [];

        map.on("click", ev => {
            const { lat, lng } = ev.latlng;

            if (tool === 'add-stop') {
                if (stopSpec) {
                    stopSpec.lat = lat;
                    stopSpec.lng = lng;
                } else {
                    stopSpec = {
                        code: "",
                        name: "",
                        name_tts: "",
                        lat,
                        lng,
                        type: StopType.StopOrPlatform,
                        wheelchair_boarding: WheelchairBoarding.Unspecified,
                    };
                }

                map.setView(ev.latlng, Math.max(18, map._zoom));
            } else if (polyPoints.length > 9) {
                map.addLayer(
                    new L.Polygon([
                        polyPoints.slice(0, 5) as any,
                        polyPoints.slice(5) as any,
                    ], {
                        fill: true,
                        fillColor: "blue",
                    }),
                );
                polyPoints.length = 0;
            } else {
                polyPoints.push(new L.LatLng(lat, lng));
            }
        })
    });

    onDestroy((): void => {
        map?.dispose();
    });

    function cancel(): void {
        stopSpec = undefined;
    }

    function createStop(): void {
        
    }
</script>

<div class="layout">
    <div class="map" style:cursor={tool === "add-stop" ? "crosshair" : undefined} bind:this={mapContainer}>
        {#if map}
            {#if stopSpec}
                <Marker lat={stopSpec.lat} lng={stopSpec.lng} />
            {/if}
        {/if}
    </div>
    <div class="map-tools">
        <div class="toolbar sticky">
            <h2 class="flex-grow">{projectName}</h2>
            <div class="select-wrapper">
                <select aria-label="Project navigation" use:autofocus>
                    <option>Edit</option>
                    <option>Collaborators</option>
                    <option>Comments</option>
                </select>
            </div>
        </div>
        <div class="toolbar secondary" role="toolbar">
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
            {#if stopSpec}
                <form on:submit|preventDefault={createStop}>
                    <h3>Create Stop</h3>
                    <div class="form-fields">

                        <TextField
                            label="Name"
                            hint="Customer-facing name for the stop"
                            bind:value={stopSpec.name}
                            required
                            autofocus />
                
                        <TextField
                            label="Text-to-Speech Name"
                            hint="What ADA systems will announce verbally; should be free of abbreviations and contractions"
                            bind:value={stopSpec.name_tts} />

                        <TextField
                            label="Code"
                            hint="Customer-facing *short* identifier, such as a number for use in a phone-based stop predictions service (e.g. 0473)"
                            bind:value={stopSpec.code} />
                
                        <TextArea
                            label="Description"
                            hint="Useful information for recognizing/using the stop"
                            placeholder="Located just to the left of Anna's Sandwich Shop. No rain shelter."
                            bind:value={stopSpec.desc} />
            
                        <Select
                            label="Wheelchair Boarding"
                            hint="Available only means there is *some* availability"
                            bind:value={stopSpec.wheelchair_boarding}>
                            <option value={WheelchairBoarding.Unspecified}>Unspecified</option>
                            <option value={WheelchairBoarding.Some}>Available</option>
                            <option value={WheelchairBoarding.None}>Unavailable</option>
                        </Select>

                        <Select label="Location Type" bind:value={stopSpec.type} required>
                            {#each STOP_TYPES as name, type}
                                <option value={type}>{name}</option>
                            {/each}
                        </Select>

                        <!--
                            TODO: need to remove stopSpec.parent_station if they make
                            the type of this stop a station
                        -->
                        {#if stopSpec.type !== StopType.Station}
                            <TextField
                                label="Parent Station/Platform ID"
                                bind:value={stopSpec.parent_station}
                                required={stopSpec.type !== StopType.StopOrPlatform} />
                        {/if}

                        <TextField
                            label="Fare Zone ID"
                            hint="Required if providing a fare structure using this system"
                            bind:value={stopSpec.zone_id} />

                        <TextField
                            label="URL"
                            hint="URL of webpage dedicated to *this* stop; do NOT link to website home page"
                            bind:value={stopSpec.url} />

                        <TextField
                            label="Time Zone"
                            hint="Should only be specified if different from agency time zone"
                            bind:value={stopSpec.timezone} />

                        <TextField
                            label="Level"
                            bind:value={stopSpec.level_id} />

                        {#if stopSpec.parent_station}
                            <TextField
                                label="Platform Code"
                                bind:value={stopSpec.platform_code} />
                        {/if}

                        <TextField
                            label="ID"
                            hint="Internal, unique identifier; randomly generated by default"
                            bind:value={stopSpec.id} />
            
                    </div>
                    <div class="form-actions">
                        <button type="button" on:click={cancel}>
                            Cancel
                        </button>
                        <button type="submit" class="filled">
                            Create Stop
                        </button>
                    </div>
                </form>
            {:else}
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
            {/if}
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
        overflow-y: auto;
    }

    h2 {
        margin: 0;
    }

    .toolbar {
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
    }

    .toolbar.sticky {
        position: sticky;
        top: 0;
        z-index: 1;
        background-color: #fff;
    }

    .toolbar.secondary {
        border: 1px solid rgba(0, 0, 0, .12);
        border-width: 1px 0;
        background-color: #eee;
    }
</style>
