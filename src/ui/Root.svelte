<script lang="ts">
    import Router from "svelte-spa-router";
    import { MY_INFO$, SESSION$, logout } from "../state/session";
    import Auth from "./Auth.svelte";
    import Breadcrumbs from "./Breadcrumbs.svelte";
    import Debug from "./pages/Debug.svelte";
    import Home from "./pages/Home.svelte";
    import ProjectHome from "./pages/ProjectHome.svelte";
    import ProjectMap from "./pages/ProjectMap.svelte";
    import Projects from "./pages/Projects.svelte";
    import RegTokens from "./pages/RegTokens.svelte";
    import Users from "./pages/Users.svelte";
    import ModalContainer from "./widgets/ModalContainer.svelte";

    const routes = {
        '/': Home,
        '/projects': Projects,
        '/projects/:id': ProjectHome,
        '/projects/:id/map': ProjectMap,
        '/registration-tokens': RegTokens,
        '/users': Users,
        '/debug': Debug,
    };
</script>

{#if $SESSION$.state === "logged-in"}
    <div class="app-shell isolate">
        <nav>
            <Breadcrumbs />
            <div class="flex-grow" />
            <button class="main-menu" on:click={logout}>
                {$MY_INFO$.name} - click to log out
            </button>
        </nav>
        <Router {routes} />
    </div>
    <ModalContainer />
{:else}
    <Auth />
{/if}

<style>
    .main-menu {
        padding: 4px 8px;
        background-color: #388E3C;
        color: white;
        border-radius: 6px;
    }

    .app-shell {
        display: flex;
        flex-direction: column;
        align-items: stretch;

        min-height: 100vh;
    }

    nav {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        padding: 8px 12px;
        min-height: 48px;
        background-color: #fff;
        z-index: 1;
        position: sticky;
        top: 0;
        border-bottom: 1px solid #777;
    }

    .app-shell :global(main) {
        flex: 1 0 0;
        min-height: min-content; /* needed for children to be able to use % of computed height */
    }
</style>