<script lang="ts">
    import { SESSION$ } from "./session";
    import Login from "./ui/Login.svelte";
    import Main from "./ui/Main.svelte";
</script>

{#if $SESSION$.state === "logged-in"}
    <Main conn={$SESSION$.conn} firstLogin={$SESSION$.firstLogin} />
{:else}
    <Login />
{/if}
