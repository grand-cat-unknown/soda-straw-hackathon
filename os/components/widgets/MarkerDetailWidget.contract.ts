import { PlaceSchema } from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const MarkerDetailWidgetContract: WidgetContract = {
  type: "marker-detail",
  title: "Selected place",
  description: "Shows the selected marker emitted by a map widget.",
  inputs: {
    marker: {
      schema: PlaceSchema,
      description: "Marker to show in the detail panel.",
      optional: true,
    },
  },
  outputs: {
    marker: {
      schema: PlaceSchema,
      description: "Marker the user confirmed from the detail panel.",
    },
  },
  render: {
    renderer: "marker-detail",
    defaultLayout: { x: 8, y: 0, w: 4, h: 3 },
    minLayout: { w: 3, h: 2 },
    chrome: "card",
    editable: true,
    outputActions: {
      marker: "Use marker button",
    },
  },
};
