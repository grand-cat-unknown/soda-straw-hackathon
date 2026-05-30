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
    defaultLayout: { size: "small", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      result: "Emit result button",
      value: "Use value button",
      selectedOption: "Option selection buttons",
    },
  },
  toolCandidates: [
    {
      capabilityId: "calculator.compute",
      inputPort: "result",
      resultPath: "$",
      purpose: "Render an evaluated expression.",
    },
    {
      capabilityId: "calculator.score_options",
      inputPort: "ranked",
      resultPath: "$.ranked",
      purpose: "Render ranked scored options.",
    },
  ],
  toolActions: {
    compute: {
      capabilityId: "calculator.compute",
      refreshBindings: ["result"],
    },
    scoreOptions: {
      capabilityId: "calculator.score_options",
      refreshBindings: ["ranked"],
    },
  },
};
