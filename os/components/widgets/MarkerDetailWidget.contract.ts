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
    defaultLayout: { size: "small", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      marker: "Use marker button",
    },
  },
};
