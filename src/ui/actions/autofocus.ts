import type { ActionReturn } from "svelte/action";

export function autofocus(el: HTMLElement): ActionReturn {
    setTimeout(() => el.focus());
    return {};
}
