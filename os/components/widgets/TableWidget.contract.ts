import { TableSchema } from "@/lib/workspace/schemas";
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
  },
  outputs: {
    selectedRows: {
      schema: { $id: "fluid.table.rows", type: "array" },
      description: "Rows selected by the user.",
    },
  },
  render: {
    renderer: "table",
    defaultLayout: { x: 0, y: 0, w: 12, h: 4 },
    minLayout: { w: 5, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedRows: "Row selection checkboxes",
    },
  },
};
