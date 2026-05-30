import {
  TableSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const TableWidgetContract: WidgetContract = {
  type: "table",
  title: "Table",
  description: "Renders structured rows returned by the tables capability.",
  inputs: {
    table: {
      schema: TableSchema,
      description: "Structured table data to render.",
    },
    row: {
      schema: UnknownRecordSchema,
      description: "Single record to append into the rendered table.",
      optional: true,
    },
    rows: {
      schema: UnknownArraySchema,
      description: "Records to append into the rendered table.",
      optional: true,
    },
  },
  outputs: {
    selectedRows: {
      schema: { $id: "fluid.table.rows", type: "array" },
      description: "Rows selected by the user.",
    },
  },
  render: {
    renderer: "table",
    defaultLayout: { size: "xlarge", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedRows: "Row selection checkboxes",
    },
  },
  toolCandidates: [
    {
      capabilityId: "tables.get",
      inputPort: "table",
      resultPath: "$",
      purpose: "Render a full structured table from the backend.",
    },
    {
      capabilityId: "tables.create",
      inputPort: "table",
      resultPath: "$",
      purpose: "Render the table created by the backend.",
    },
  ],
  toolActions: {
    addRow: {
      capabilityId: "tables.add_row",
      refreshBindings: ["table"],
    },
  },
};
