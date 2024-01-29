import type { ActionReturn } from "svelte/action";
import tippy, { type Props } from "tippy.js";

export function tooltip(el: HTMLElement, opts?: Partial<Props>): ActionReturn {
    const t = tippy(el, opts);
    
    return {
        destroy(): void {
            t.destroy();
        },
    };
}