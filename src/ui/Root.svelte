<script lang="ts">
    import Router from "svelte-spa-router";
    import active from "svelte-spa-router/active";
    import { SESSION$, logout } from "../state/session";
    import Auth from "./Auth.svelte";
    import Debug from "./pages/Debug.svelte";
    import Map from "./pages/Map.svelte";
    import RegTokens from "./pages/RegTokens.svelte";
    import Users from "./pages/Users.svelte";
    import ModalContainer from "./widgets/ModalContainer.svelte";

    const routes = {
        '/': Map,
        '/registration-tokens': RegTokens,
        '/users': Users,
        '/debug': Debug,
    };
</script>

{#if $SESSION$.state === "logged-in"}
    {@const user = $SESSION$.conn.user}
    <div class="isolate">
        <nav>
            <a href="#/" use:active={"/"}>
                Map
            </a>
            <a href="#/users" use:active={"/users/*"}>
                Users
            </a>
            <a href="#/registration-tokens" use:active={"/registration-tokens/*"}>
                Registration Tokens
            </a>
            <a href="#/debug" use:active={"/debug/*"}>
                Debug
            </a>
            <div class="flex-grow" />
            <button class="main-menu" on:click={logout}>
                {user.name} - click to log out
            </button>
        </nav>
        <main>
            <Router {routes} />
        </main>
    </div>
    <ModalContainer />
{:else}
    <Auth />
{/if}

<style>
    a {
        margin: 0 16px;
        font-size: 1.5rem;
    }

    .main-menu {
        padding: 4px 8px;
        background-color: #388E3C;
        color: white;
        border-radius: 6px;
    }

    .isolate {
        isolation: isolate;
    }

    nav {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        min-height: 48px;
        background-color: #fff;
        z-index: 1;
        position: sticky;
        top: 0;
        border-bottom: 1px solid #777;
    }

    main {
        padding-bottom: 48px;
    }
</style>