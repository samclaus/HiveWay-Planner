import { rx } from "../rx";

const debug = new rx.MutableValue<boolean>(localStorage.getItem("debug") === "true");
export const DEBUG: rx.ValueWithSnapshot<boolean> = debug;

export function enableDebugging(): void {
    debug.setValue(true);
    localStorage.setItem("debug", "true");
}

export function disableDebugging(): void {
    debug.setValue(false);
    localStorage.removeItem("debug");
}

// Make the functions globally accessible
Object.assign(window, { enableDebugging, disableDebugging });