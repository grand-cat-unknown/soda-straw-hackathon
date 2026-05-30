import {
  PlaceArraySchema,
  PlaceSchema,
  RouteSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const MapWidgetContract: WidgetContract = {
  type: "map",
  title: "Map",
  description: "Renders places and routes, and publishes selected markers.",
  inputs: {
    markers: {
      schema: PlaceArraySchema,
      description: "Pins to drop on the map.",
    },
    route: {
      schema: RouteSchema,
      description: "Optional route to draw through the markers.",
      optional: true,
    },
  },
  outputs: {
    selectedMarker: {
      schema: PlaceSchema,
      description: "Marker the user last clicked.",
    },
  },
  render: {
    renderer: "map",
    defaultLayout: { x: 0, y: 0, w: 8, h: 6 },
    minLayout: { w: 5, h: 4 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedMarker: "Marker click or marker selection buttons",
    },
  },
};
