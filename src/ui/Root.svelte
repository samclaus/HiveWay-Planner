<script lang="ts">
    import Router from "svelte-spa-router";
    import active from "svelte-spa-router/active";
    import { MY_INFO$, SESSION$, logout } from "../state/session";
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
    <div class="app-shell isolate">
        <nav>
            <a href="#/" use:active={"/"}>
                Map
            </a>
            <a href="#/users" use:active={"/users*"}>
                Users
            </a>
            {#if $MY_INFO$.rank}
                <a href="#/registration-tokens" use:active={"/registration-tokens*"}>
                    Registration Tokens
                </a>
            {/if}
            <a href="#/debug" use:active={"/debug"}>
                Debug
            </a>
            <div class="flex-grow" />
            <button class="main-menu" on:click={logout}>
                {$MY_INFO$.name} - click to log out
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
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 8px 12px;
        font-size: 1.5rem;
        text-decoration: none;
    }

    a:hover {
        background-color: rgba(0, 0, 0, .12);
    }

    a:focus-visible {
        border-color: #333;
    }

    a:global(.active) {
        text-decoration: underline;
    }

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

    .isolate {
        isolation: isolate;
    }

    nav {
        flex-shrink: 0;
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
        flex: 1 0 0;
        min-height: 0; /* needed for children to be able to use % of computed height */
    }
</style>