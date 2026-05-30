import type {
  CanvasBridgeSpec,
  CanvasLayout,
  CanvasWidgetSpec,
  ToolCallTrace,
  WidgetEdge,
  WidgetNode,
  WorkspaceCanvas,
  WorkspaceGraph,
  WorkspaceTable,
} from "@/lib/workspace/types";
import { canvasStore } from "@/lib/workspace/store";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function portNodeId(ref: CanvasBridgeSpec["from"]): string {
  return ref.nodeId ?? ref.node_id ?? "";
}

function defaultLayout(index: number): CanvasLayout {
  return {
    x: index % 2 === 0 ? 0 : 6,
    y: Math.floor(index / 2) * 4,
    w: 6,
    h: 4,
  };
}

function canvasToGraph(canvas: WorkspaceCanvas): WorkspaceGraph {
  const canvasWidgets = Array.isArray(canvas.widgets) ? canvas.widgets : [];
  if (canvasWidgets.length === 0) {
    return {
      nodes: [
        {
          id: `canvas:${canvas.id}`,
          type: "canvas-summary",
          title: canvas.title,
          input: { canvas },
        },
      ],
      edges: [],
    };
  }

  const nodes: WidgetNode[] = canvasWidgets.map((widget) => ({
    id: widget.id,
    type: widget.type,
    title: widget.title,
    input: widget.input ?? {},
  }));

  const edges: WidgetEdge[] = (canvas.bridges ?? []).map((bridge) => ({
    id: bridge.id,
    from: { nodeId: portNodeId(bridge.from), port: bridge.from.port },
    to: { nodeId: portNodeId(bridge.to), port: bridge.to.port },
    transform: bridge.transform ?? undefined,
  }));

  return { nodes, edges };
}

export function buildWorkspaceGraph(traces: ToolCallTrace[]): WorkspaceGraph {
  const nodes = new Map<string, WidgetNode>();
  let latestCanvas: WorkspaceCanvas | null = null;

  for (const trace of traces) {
    if (trace.error || !trace.output) continue;
    const output = trace.output;

    if (isRecord(output) && "id" in output && "columns" in output) {
      const table = output as unknown as WorkspaceTable;
      nodes.set(`table:${table.id}`, {
        id: `table:${table.id}`,
        type: "table",
        title: table.name,
        input: { table },
      });
    }

    if (
      (CANVAS_TOOL_NAMES.has(trace.name) || matches(trace.name, ["canvas_render", "canvas_get"])) &&
      isRecord(output) &&
      "layout" in output
    ) {
      latestCanvas = output as unknown as WorkspaceCanvas;
    }
  }

  if (latestCanvas) {
    const graph = canvasToGraph(latestCanvas);
    if (graph.nodes.length > 0) return graph;
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: [],
  };
}

export function buildWorkspaceTables(traces: ToolCallTrace[]): WorkspaceTable[] {
  const tables = new Map<string, WorkspaceTable>();

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
  }

  return Array.from(tables.values());
}

export function buildWorkspaceCanvases(traces: ToolCallTrace[]): WorkspaceCanvas[] {
  const canvases: WorkspaceCanvas[] = [];

  for (const trace of traces) {
    if (trace.error || !trace.output) continue;
    const output = trace.output as Record<string, unknown>;

    if (
      CANVAS_TOOL_NAMES.has(trace.name) ||
      matches(trace.name, ["canvas_render", "canvas_get"])
    ) {
      if (output && typeof output === "object" && "layout" in output) {
        canvases.push(output as unknown as WorkspaceCanvas);
      }
    }
  }

  return canvases;
}

function addCanvasWidgetFromSpec(
  trace: ToolCallTrace,
  widget: CanvasWidgetSpec,
  index: number,
): void {
  canvasStore.applyTraceMutation({
    operationId: `${trace.id}:widget:${widget.id || index}`,
    apply: () => {
      canvasStore.addWidget({
        id: widget.id || `${trace.id}:widget:${index}`,
        type: widget.type,
        title: widget.title,
        input: widget.input ?? {},
        layout: defaultLayout(index),
        source: "tool",
      });
    },
  });
}

function addCanvasBridgeFromSpec(
  trace: ToolCallTrace,
  bridge: CanvasBridgeSpec,
  index: number,
): void {
  canvasStore.applyTraceMutation({
    operationId: `${trace.id}:bridge:${bridge.id || index}`,
    apply: () => {
      canvasStore.addBridge({
        id: bridge.id || `${trace.id}:bridge:${index}`,
        from: { nodeId: portNodeId(bridge.from), port: bridge.from.port },
        to: { nodeId: portNodeId(bridge.to), port: bridge.to.port },
        transform: bridge.transform ?? undefined,
        createdBy: "tool",
      });
    },
  });
}

export function applyToolTraceToCanvasStore(trace: ToolCallTrace): void {
  if (trace.error || !trace.output) return;
  const output = trace.output;

  if (isRecord(output) && "id" in output && "columns" in output) {
    const table = output as unknown as WorkspaceTable;
    canvasStore.applyTraceMutation({
      operationId: `${trace.id}:table:${table.id}`,
      apply: () => {
        canvasStore.addWidget({
          id: `table:${table.id}`,
          type: "table",
          title: table.name,
          input: { table },
          source: "tool",
        });
      },
    });
  }

  if (
    (CANVAS_TOOL_NAMES.has(trace.name) || matches(trace.name, ["canvas_render", "canvas_get"])) &&
    isRecord(output) &&
    "layout" in output
  ) {
    const canvas = output as unknown as WorkspaceCanvas;
    const widgets = Array.isArray(canvas.widgets) ? canvas.widgets : [];

    if (widgets.length === 0) {
      canvasStore.applyTraceMutation({
        operationId: `${trace.id}:canvas-summary:${canvas.id}`,
        apply: () => {
          canvasStore.addWidget({
            id: `canvas:${canvas.id}`,
            type: "canvas-summary",
            title: canvas.title,
            input: { canvas },
            source: "tool",
          });
        },
      });
      return;
    }

    widgets.forEach((widget, index) => addCanvasWidgetFromSpec(trace, widget, index));
    (canvas.bridges ?? []).forEach((bridge, index) =>
      addCanvasBridgeFromSpec(trace, bridge, index),
    );
  }
}
