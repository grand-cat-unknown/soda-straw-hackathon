export type ToolCallTrace = {
  id: string;
  server_label: string;
  name: string;
  arguments: unknown;
  output: unknown;
  error: string | null;
};

export type PendingCall = {
  id: string;
  name: string;
  server_label: string;
};

export function prettyToolName(name: string): string {
  // "fluid-os-tables_tables_create" -> "tables.create"
  const stripped = name.replace(/^fluid-os-[^_]+_/, "");
  return stripped.replace(/_/g, ".");
}

export type WorkspaceTable = {
  id: string;
  name: string;
  columns: { name: string; type: string }[];
  rows: { id: string; values: Record<string, unknown> }[];
};

export type WorkspaceCanvas = {
  id: string;
  title: string;
  layout: string;
  data_sources: { tool: string; capability_id: string; params?: unknown }[];
  actions: { label: string; capability_id: string; params?: unknown }[];
};

export type Workspace = {
  tables: WorkspaceTable[];
  canvases: WorkspaceCanvas[];
};

const TABLE_TOOL_NAMES = new Set([
  "fluid-os-tables_tables_create",
  "fluid-os-tables_tables_add_row",
  "fluid-os-tables_tables_get",
]);

const CANVAS_TOOL_NAMES = new Set([
  "fluid-os-canvas_canvas_render",
  "fluid-os-canvas_canvas_get",
]);

function matches(name: string, suffixes: string[]): boolean {
  return suffixes.some((s) => name.endsWith(s));
}

export function buildWorkspace(traces: ToolCallTrace[]): Workspace {
  const tables = new Map<string, WorkspaceTable>();
  const canvases: WorkspaceCanvas[] = [];

  for (const trace of traces) {
    if (trace.error || !trace.output) continue;
    const output = trace.output as Record<string, unknown>;

    if (
      TABLE_TOOL_NAMES.has(trace.name) ||
      matches(trace.name, ["tables_create", "tables_get"])
    ) {
      if (output && typeof output === "object" && "id" in output && "columns" in output) {
        const table = output as unknown as WorkspaceTable;
        tables.set(table.id, table);
      }
    }

    if (matches(trace.name, ["tables_add_row"])) {
      // Row return shape: { id, values }. We don't know the table id from the row alone,
      // so this is a no-op here — agent should call tables.get afterwards to refresh.
    }

    if (
      CANVAS_TOOL_NAMES.has(trace.name) ||
      matches(trace.name, ["canvas_render", "canvas_get"])
    ) {
      if (output && typeof output === "object" && "layout" in output) {
        canvases.push(output as unknown as WorkspaceCanvas);
      }
    }
  }

  return { tables: Array.from(tables.values()), canvases };
}
