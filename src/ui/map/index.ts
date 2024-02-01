import CircleTool from "./CircleTool.svelte";
import PolygonTool from "./PolygonTool.svelte";
import PolylineTool from "./PolylineTool.svelte";
import SelectTool from "./SelectTool.svelte";
import StopTool from "./StopTool.svelte";

export * from "./core";

export const MAP_TOOLS = {
    "select": SelectTool,
    "add-stop": StopTool,
    "polyline": PolylineTool,
    "polygon": PolygonTool,
    "circle": CircleTool,
} as const;

export type MapTool = keyof (typeof MAP_TOOLS);
