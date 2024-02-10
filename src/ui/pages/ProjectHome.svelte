<script lang="ts">
    import "leaflet-lite/styles";
    import { PROJECTS } from "../../state/projects";
    import { BREADCRUMBS } from "../Breadcrumbs.svelte";

    export let params: {
        id: string;
    };

    $: projName = $PROJECTS && PROJECTS.get(params.id)?.name || params.id;
    $: {
        const newBreadcrumbs: any = [
            ["Projects", "/projects"],
            [projName, `/projects/${params.id}`],
        ];
        console.log("Setting breadcrumbs:", newBreadcrumbs.map(b => b[0]).join(" / "));
        $BREADCRUMBS = newBreadcrumbs;
    }
</script>

<main class="padding-heavy">

    <h1>{projName}</h1>

    <p>
        Eventually, this will be a dashboard for interacting with the project.
        But for now, it just links to the <a href="#/projects/{params.id}/map">project map</a>.
    </p>

</main>