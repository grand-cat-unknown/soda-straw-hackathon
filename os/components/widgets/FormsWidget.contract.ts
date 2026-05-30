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
    defaultLayout: { size: "medium", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedForm: "Form selection buttons",
      selectedResponse: "Response selection buttons",
    },
  },
  toolCandidates: [
    {
      capabilityId: "forms.list",
      inputPort: "forms",
      resultPath: "$.forms",
      purpose: "Render form definitions from the backend.",
    },
    {
      capabilityId: "forms.get",
      inputPort: "form",
      resultPath: "$",
      purpose: "Render one form definition from the backend.",
    },
    {
      capabilityId: "forms.list_responses",
      inputPort: "responses",
      resultPath: "$.responses",
      purpose: "Render submitted form responses from the backend.",
    },
  ],
  toolActions: {
    createForm: {
      capabilityId: "forms.create",
      refreshBindings: ["forms"],
    },
    submitResponse: {
      capabilityId: "forms.submit_response",
      refreshBindings: ["responses"],
    },
  },
};
