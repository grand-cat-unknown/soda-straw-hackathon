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

export type WorkspaceTable = {
  id: string;
  name: string;
  columns: { name: string; type: string }[];
  rows: { id: string; values: Record<string, unknown> }[];
};

export type JsonSchema = {
  $id?: string;
  type?: string | string[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  additionalProperties?: boolean | JsonSchema;
};

export type CanvasWidgetSpec = {
  id: string;
  type: string;
  title: string;
  input?: WidgetInput;
  outputs?: string[];
};

export type CanvasBridgeSpec = {
  id: string;
  from: { node_id?: string; nodeId?: string; port: string };
  to: { node_id?: string; nodeId?: string; port: string };
  transform?: string | null;
};

export type WorkspaceCanvas = {
  id: string;
  title: string;
  layout: string;
  data_sources: { tool: string; capability_id: string; params?: unknown }[];
  actions: { label: string; capability_id: string; params?: unknown }[];
  widgets?: CanvasWidgetSpec[];
  bridges?: CanvasBridgeSpec[];
};

export type WidgetPort = {
  name: string;
  description?: string;
};

export type WidgetType = string;
export type NodeId = string;
export type EdgeId = string;
export type Port = string;

export type WidgetInput = Record<string, unknown>;
export type WidgetOutput = Record<string, unknown>;

export type WidgetPortContract = {
  schema: JsonSchema;
  description: string;
  optional?: boolean;
};

export type WidgetContract = {
  type: WidgetType;
  title: string;
  description: string;
  inputs: Record<string, WidgetPortContract>;
  outputs: Record<string, WidgetPortContract>;
};

export type WidgetDefinition = {
  type: WidgetType;
  title: string;
  description: string;
  inputs: WidgetPort[];
  outputs: WidgetPort[];
};

export type WidgetNode = {
  id: string;
  type: WidgetType;
  title: string;
  input: WidgetInput;
};

export type TransformRef = {
  id: string;
  params?: Record<string, unknown>;
};

export type WidgetEdge = {
  id: string;
  from: { nodeId: string; port: string };
  to: { nodeId: string; port: string };
  transform?: string | TransformRef;
};

export type Bridge = {
  id: EdgeId;
  from: { nodeId: NodeId; port: Port };
  to: { nodeId: NodeId; port: Port };
  transform?: TransformRef;
  direction: "forward" | "bidirectional";
  createdBy: "agent" | "user" | "tool";
};

export type CanvasLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CanvasMutationSource = "agent" | "user" | "tool";

export type CanvasState = {
  nodes: Record<NodeId, WidgetNode>;
  edges: Record<EdgeId, Bridge>;
  outputs: Record<NodeId, Record<Port, unknown>>;
  layout: Record<NodeId, CanvasLayout>;
  appliedTraceIds: Record<string, true>;
  meta: { revision: number; lastTouchedBy: CanvasMutationSource };
};

export type WorkspaceGraph = {
  nodes: WidgetNode[];
  edges: WidgetEdge[];
};

export type Workspace = {
  tables: WorkspaceTable[];
  canvases: WorkspaceCanvas[];
  graph: WorkspaceGraph;
};

export function prettyToolName(name: string): string {
  // "fluid-os-tables_tables_create" -> "tables.create"
  const stripped = name.replace(/^fluid-os-[^_]+_/, "");
  return stripped.replace(/_/g, ".");
}
