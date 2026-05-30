import {
  AnySchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const NotesWidgetContract: WidgetContract = {
  type: "notes",
  title: "Notes",
  description: "Renders notes from the notes capability.",
  inputs: {
    notes: {
      schema: UnknownArraySchema,
      description: "Notes returned by notes.list.",
      optional: true,
    },
    note: {
      schema: UnknownRecordSchema,
      description: "Single note returned by note actions.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw notes capability result.",
      optional: true,
    },
  },
  outputs: {
    selectedNote: {
      schema: UnknownRecordSchema,
      description: "Note selected by the user.",
    },
  },
  render: {
    renderer: "notes",
    defaultLayout: { x: 0, y: 0, w: 6, h: 4 },
    minLayout: { w: 4, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedNote: "Note selection buttons",
    },
  },
};
