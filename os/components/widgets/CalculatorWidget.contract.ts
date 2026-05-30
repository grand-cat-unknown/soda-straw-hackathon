import {
  AnySchema,
  CalculatorResultSchema,
  NumberSchema,
  StringSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const CalculatorWidgetContract: WidgetContract = {
  type: "calculator",
  title: "Calculator",
  description:
    "Renders calculator results and weighted option rankings from the calculator capability.",
  inputs: {
    result: {
      schema: CalculatorResultSchema,
      description:
        "Calculator tool result, such as { value, expression } or { ranked }.",
      optional: true,
    },
    value: {
      schema: NumberSchema,
      description: "Numeric result from calculator.compute.",
      optional: true,
    },
    expression: {
      schema: StringSchema,
      description: "Expression that produced the numeric result.",
      optional: true,
    },
    ranked: {
      schema: UnknownArraySchema,
      description: "Ranked options from calculator.score_options.",
      optional: true,
    },
  },
  outputs: {
    result: {
      schema: AnySchema,
      description: "Calculator result currently shown by the widget.",
    },
    value: {
      schema: NumberSchema,
      description: "Numeric value from the displayed result.",
    },
    selectedOption: {
      schema: UnknownRecordSchema,
      description: "Ranked option selected by the user.",
    },
  },
  render: {
    renderer: "calculator",
    defaultLayout: { x: 0, y: 0, w: 6, h: 4 },
    minLayout: { w: 4, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      result: "Emit result button",
      value: "Use value button",
      selectedOption: "Option selection buttons",
    },
  },
};
