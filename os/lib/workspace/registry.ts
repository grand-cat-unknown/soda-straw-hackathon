import type { WidgetDefinition, WidgetType } from "@/lib/workspace/types";

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  "canvas-summary": {
    type: "canvas-summary",
    title: "Canvas",
    description: "Summarizes a generated Fluid OS canvas and its declared actions.",
    inputs: [{ name: "canvas" }],
    outputs: [],
  },
  table: {
    type: "table",
    title: "Table",
    description: "Renders structured rows returned by the tables capability.",
    inputs: [{ name: "table" }],
    outputs: [{ name: "selectedRows" }],
  },
  map: {
    type: "map",
    title: "Map",
    description: "Renders places and routes, and publishes selected markers.",
    inputs: [{ name: "markers" }, { name: "route" }],
    outputs: [{ name: "selectedMarker" }],
  },
  "marker-detail": {
    type: "marker-detail",
    title: "Selected place",
    description: "Shows the selected marker emitted by a map widget.",
    inputs: [{ name: "marker" }],
    outputs: [],
  },
  "tool-result": {
    type: "tool-result",
    title: "Tool result",
    description: "Renders a generic tool result when no specialized widget is declared.",
    inputs: [{ name: "value" }],
    outputs: [],
  },
};
