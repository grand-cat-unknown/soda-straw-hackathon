import {
  AnySchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const FilesWidgetContract: WidgetContract = {
  type: "files",
  title: "Files",
  description: "Renders file records and file lists.",
  inputs: {
    files: {
      schema: UnknownArraySchema,
      description: "Files from files.list.",
      optional: true,
    },
    file: {
      schema: UnknownRecordSchema,
      description: "Single file record from file actions.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw files capability result.",
      optional: true,
    },
  },
  outputs: {
    selectedFile: {
      schema: UnknownRecordSchema,
      description: "File selected by the user.",
    },
  },
  render: {
    renderer: "files",
    defaultLayout: { size: "medium", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedFile: "File selection buttons",
    },
  },
  toolCandidates: [
    {
      capabilityId: "files.list",
      inputPort: "files",
      resultPath: "$.files",
      purpose: "Render stored files from the backend.",
    },
    {
      capabilityId: "files.get",
      inputPort: "file",
      resultPath: "$",
      purpose: "Render one file record from the backend.",
    },
  ],
  toolActions: {
    storeFile: {
      capabilityId: "files.store",
      refreshBindings: ["files"],
    },
    linkFile: {
      capabilityId: "files.link",
      refreshBindings: ["files", "file"],
    },
  },
};
