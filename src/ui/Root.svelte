<script lang="ts">
    import Router from "svelte-spa-router";
    import active from "svelte-spa-router/active";
    import { SESSION$, logout } from "../state/session";
    import Auth from "./Auth.svelte";
    import Debug from "./pages/Debug.svelte";
    import RegTokens from "./pages/RegTokens.svelte";
    import ModalContainer from "./widgets/ModalContainer.svelte";

    const routes = {
        '/': Debug,
        '/registration-tokens': RegTokens,
    };
</script>

{#if $SESSION$.state === "logged-in"}
    {@const user = $SESSION$.conn.user}
    <div class="isolate">
        <nav class="hw-toolbar">
            <a href="#/" use:active={"/"}>
                Home
            </a>
            <a href="#/registration-tokens" use:active={"/registration-tokens/*"}>
                Registration Tokens
            </a>
            <div class="flex-grow" />
            <button class="main-menu" on:click={logout}>
                {user.username} - click to log out
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