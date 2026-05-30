import {
  AnySchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const FormsWidgetContract: WidgetContract = {
  type: "forms",
  title: "Forms",
  description: "Renders form definitions and submitted form responses.",
  inputs: {
    forms: {
      schema: UnknownArraySchema,
      description: "Forms from forms.list.",
      optional: true,
    },
    form: {
      schema: UnknownRecordSchema,
      description: "Single form from forms.create or forms.get.",
      optional: true,
    },
    responses: {
      schema: UnknownArraySchema,
      description: "Submitted responses from forms.list_responses.",
      optional: true,
    },
    response: {
      schema: UnknownRecordSchema,
      description: "Single submitted form response.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw forms capability result.",
      optional: true,
    },
  },
  outputs: {
    selectedForm: {
      schema: UnknownRecordSchema,
      description: "Form selected by the user.",
    },
    selectedResponse: {
      schema: UnknownRecordSchema,
      description: "Form response selected by the user.",
    },
  },
  render: {
    renderer: "forms",
    defaultLayout: { x: 0, y: 0, w: 50, h: 5 },
    minLayout: { w: 33, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedForm: "Form selection buttons",
      selectedResponse: "Response selection buttons",
    },
  },
};
