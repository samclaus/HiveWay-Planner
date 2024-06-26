import * as L from "leaflet-lite";
import { hexEncode } from "../../encoding";
import { insecureRandomInt } from "../../lib/random";
import type { GeometryStyles } from "../../state/project-features";

export interface MapElem {
    layer: L.Layer;
    name: string;
    type: "stop" | "polyline" | "polygon";
}

export function defaultGeometryStyles(): GeometryStyles {
    return {
        stroke: true,
        color: "#" + hexEncode(new Uint8Array([
            insecureRandomInt(220),
            insecureRandomInt(220),
            insecureRandomInt(220),
        ])),
        weight: 1,
        fill: true,
        fillColor: undefined,
        fillOpacity: 0.2,
    };
}
