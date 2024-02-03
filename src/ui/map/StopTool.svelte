<script lang="ts">
    import * as L from "leaflet-lite";
    import blueMarkerURL from "leaflet-lite/assets/marker.svg";
    import { onDestroy } from "svelte";
    import { STOP_TYPES, StopType, WheelchairBoarding, createStop, type StopSpec } from "../../state/project-features";
    import Icon from "../widgets/Icon.svelte";
    import Select from "../widgets/Select.svelte";
    import TextArea from "../widgets/TextArea.svelte";
    import TextField from "../widgets/TextField.svelte";

    export let map: L.Map;

    const marker = new L.Marker(
        new L.LatLng(0, 0),
        L.defaultMarkerIcon(blueMarkerURL),
    );
    const circle = new L.Circle(
        new L.LatLng(0, 0),
        {
            color: "#1976D2",
            radius: 3, // meters
            weight: 1,
        },
    );

    let spec: StopSpec | undefined;

    $: if (spec?.type === StopType.Station) {
        spec.parent_station = undefined;
    }

    function onMapClick({ latlng }: any): void {
        marker.setLatLng(latlng);
        circle.setLatLng(latlng);

        if (spec) {
            spec.lat = latlng.lat;
            spec.lng = latlng.lng;
        } else {
            spec = {
                code: "",
                name: "",
                name_tts: "",
                lat: latlng.lat,
                lng: latlng.lng,
                type: StopType.StopOrPlatform,
                wheelchair_boarding: WheelchairBoarding.Unspecified,
            };
            map.addLayer(marker);
            map.addLayer(circle);
        }
    }

    map.on("click", onMapClick);

    onDestroy((): void => {
        map.removeLayer(circle);
        map.removeLayer(marker);
        map.off("click", onMapClick);
    });

    function cancel(): void {
        spec = undefined;
        map.removeLayer(circle);
        map.removeLayer(marker);
    }

    function submit(): void {
        if (spec) {
            // TODO: async handling w/ task system
            createStop(spec).then(
                cancel,
                console.error,
            );
        }
    }
</script>

{#if spec}
    <form on:submit|preventDefault={submit}>
        <h3>Create Stop</h3>
        <div class="form-fields">

            <TextField
                label="Name"
                hint="Customer-facing name for the stop"
                bind:value={spec.name}
                required
                autofocus />
    
            <TextField
                label="Text-to-Speech Name"
                hint="What ADA systems will announce verbally; should be free of abbreviations and contractions"
                bind:value={spec.name_tts} />

            <TextField
                label="Code"
                hint="Customer-facing *short* identifier, such as a number for use in a phone-based stop predictions service (e.g. 0473)"
                bind:value={spec.code} />
    
            <TextArea
                label="Description"
                hint="Useful information for recognizing/using the stop"
                placeholder="Located just to the left of Anna's Sandwich Shop. No rain shelter."
                bind:value={spec.desc} />

            <Select
                label="Wheelchair Boarding"
                hint="Available only means there is *some* availability"
                bind:value={spec.wheelchair_boarding}>
                <option value={WheelchairBoarding.Unspecified}>Unspecified</option>
                <option value={WheelchairBoarding.Some}>Available</option>
                <option value={WheelchairBoarding.None}>Unavailable</option>
            </Select>

            <Select label="Location Type" bind:value={spec.type} required>
                {#each STOP_TYPES as name, type}
                    <option value={type}>{name}</option>
                {/each}
            </Select>

            <!--
                TODO: need to remove spec.parent_station if they make
                the type of this stop a station
            -->
            {#if spec.type !== StopType.Station}
                <TextField
                    label="Parent Station/Platform ID"
                    bind:value={spec.parent_station}
                    required={spec.type !== StopType.StopOrPlatform} />
            {/if}

            <TextField
                label="Fare Zone ID"
                hint="Required if providing a fare structure using this system"
                bind:value={spec.zone_id} />

            <TextField
                label="URL"
                hint="URL of webpage dedicated to *this* stop; do NOT link to website home page"
                bind:value={spec.url} />

            <TextField
                label="Time Zone"
                hint="Should only be specified if different from agency time zone"
                bind:value={spec.timezone} />

            <TextField
                label="Level"
                bind:value={spec.level_id} />

            {#if spec.parent_station}
                <TextField
                    label="Platform Code"
                    bind:value={spec.platform_code} />
            {/if}

            <TextField
                label="ID"
                hint="Internal, unique identifier; randomly generated by default"
                bind:value={spec.id} />

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