import type { ActionReturn } from "svelte/action";

export function cardLink(el: HTMLElement): ActionReturn {
    function onClick(ev: MouseEvent): void {
        const t = ev.target as HTMLElement;

        // Do not activate the card link if they clicked a link (might have clicked the
        // card link directly OR clicked another link inside card) or interacted with a
        // button inside the card
        if (t.tagName !== "A" && t.tagName !== "BUTTON") {
            el.querySelector<HTMLAnchorElement>("[data-card-link]")?.click();
        }
    }

    el.classList.add("card-link");
    el.addEventListener("click", onClick);
    
    return {
        destroy(): void {
            el.removeEventListener("click", onClick);
            el.classList.remove("card-link");
        },
    };
}