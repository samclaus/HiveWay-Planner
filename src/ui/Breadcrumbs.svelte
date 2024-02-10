<script lang="ts" context="module">
    import { writable } from "svelte/store";

    export const BREADCRUMBS = writable<[string, string][]>([]);
</script>

<script lang="ts">
    // For some reason, we need a script tag or Svelte sometimes doesn't
    // re-render the breadcrumbs when they are updated
</script>

<a href="#/">
    Home
</a>
{#each $BREADCRUMBS as [text, href], i (i)}
    <span class="separator">/</span>
    {#if ($BREADCRUMBS.length - 1 - i)}
        <a href="#{href}">{text}</a>
    {:else}
        <!-- We will have a corresponding h1 inside <main> for screen readers only -->
        <span class="current-page" aria-hidden="true">{text}</span>
    {/if}
{/each}

<style>
    a, .current-page {
        margin: 0 16px;
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 8px 12px;
        font-size: 1.5rem;
        text-decoration: none;
    }

    .current-page {
        font-weight: 600;
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

    .separator {
        font-size: 24px;
    }
</style>