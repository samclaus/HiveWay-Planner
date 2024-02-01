import EllipseTool from "./EllipseTool.svelte";
import EquiPolygonTool from "./EquiPolygonTool.svelte";
import PolygonTool from "./PolygonTool.svelte";
import PolylineTool from "./PolylineTool.svelte";
import RectTool from "./RectTool.svelte";
import SelectTool from "./SelectTool.svelte";
import StopTool from "./StopTool.svelte";

export * from "./core";

export const MAP_TOOLS = {
    "select": SelectTool,
    "add-stop": StopTool,
    "equi-poly": EquiPolygonTool,
    "rect": RectTool,
    "ellipse": EllipseTool,
    "polyline": PolylineTool,
    "polygon": PolygonTool,
} as const;

export type MapTool = keyof (typeof MAP_TOOLS);
