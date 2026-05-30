import { CanvasSchema, UnknownRecordSchema } from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const CanvasSummaryWidgetContract: WidgetContract = {
  type: "canvas-summary",
  title: "Canvas",
  description: "Summarizes a generated Fluid OS canvas and its declared actions.",
  inputs: {
    canvas: {
      schema: CanvasSchema,
      description: "Canvas specification returned by the canvas capability.",
    },
  },
  outputs: {
    actionRequested: {
      schema: UnknownRecordSchema,
      description: "Canvas action the user clicked.",
    },
  },
  render: {
    renderer: "canvas-summary",
    defaultLayout: { x: 0, y: 0, w: 12, h: 2 },
    minLayout: { w: 4, h: 2 },
    chrome: "card",
    editable: true,
    outputActions: {
      actionRequested: "Canvas action buttons",
    },
  },
};
