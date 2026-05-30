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
    defaultLayout: { size: "medium", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedNote: "Note selection buttons",
    },
  },
  toolCandidates: [
    {
      capabilityId: "notes.list",
      inputPort: "notes",
      resultPath: "$.notes",
      purpose: "Render notes from the backend.",
    },
    {
      capabilityId: "notes.get",
      inputPort: "note",
      resultPath: "$",
      purpose: "Render one note from the backend.",
    },
  ],
  toolActions: {
    createNote: {
      capabilityId: "notes.create",
      refreshBindings: ["notes"],
    },
    updateNote: {
      capabilityId: "notes.update",
      refreshBindings: ["notes", "note"],
    },
    appendNote: {
      capabilityId: "notes.append",
      refreshBindings: ["notes", "note"],
    },
  },
};
