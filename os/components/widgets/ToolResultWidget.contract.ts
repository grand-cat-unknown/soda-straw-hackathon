import { AnySchema, UnknownRecordSchema } from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const ToolResultWidgetContract: WidgetContract = {
  type: "tool-result",
  title: "Tool result",
  description: "Renders a generic tool result when no specialized widget is declared.",
  inputs: {
    value: {
      schema: AnySchema,
      description: "Arbitrary tool result value.",
      optional: true,
    },
    fallback: {
      schema: UnknownRecordSchema,
      description: "Arbitrary record rendered as JSON.",
      optional: true,
    },
  },
  outputs: {
    value: {
      schema: AnySchema,
      description: "Tool result value the user emitted.",
    },
  },
  render: {
    renderer: "tool-result",
    defaultLayout: { size: "full", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      value: "Emit value button",
    },
  },
};
