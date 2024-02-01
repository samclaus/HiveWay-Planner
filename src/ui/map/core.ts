import * as L from "leaflet-lite";

export interface DeactivateFn {
    (): void;
}

export interface MapElem {
    layer: L.Layer;
    name: string;
    type: "stop" | "polyline" | "polygon";
}