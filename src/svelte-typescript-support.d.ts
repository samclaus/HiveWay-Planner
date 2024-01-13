/**
 * This file hooks up module declarations and whatnot so importing ".svelte" files INTO TypeScript
 * files does not yield a compiler error, and can even provide a strictly typed API thanks to the
 * Svelte plugin.
 */

/// <reference types="svelte" />