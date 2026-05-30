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

export type Place = {
  id: string;
  lng: number;
  lat: number;
  label?: string;
  color?: string;
};

export type Route = {
  geometry: GeoJSON.LineString;
  color?: string;
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

export type WidgetRenderContract = {
  renderer: string;
  defaultLayout: CanvasLayout;
  minLayout?: Partial<CanvasLayout>;
  chrome?: "card" | "panel" | "bare";
  editable?: boolean;
  outputActions?: Record<Port, string>;
};

export type WidgetContract = {
  type: WidgetType;
  title: string;
  description: string;
  inputs: Record<string, WidgetPortContract>;
  outputs: Record<string, WidgetPortContract>;
  render: WidgetRenderContract;
};

export type WidgetDefinition = {
  type: WidgetType;
  title: string;
  description: string;
  inputs: WidgetPort[];
  outputs: WidgetPort[];
  render: WidgetRenderContract;
};

export type WidgetNode = {
  id: string;
  type: WidgetType;
  title: string;
  input: WidgetInput;
};

export type WidgetComponentProps<TInput extends WidgetInput = WidgetInput> = {
  node: WidgetNode;
  input: TInput;
  emitOutput: (port: Port, value: unknown) => void;
};

export type TransformRef = {
  id: string;
  params?: Record<string, unknown>;
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
  meta: { revision: number; lastTouchedBy: CanvasMutationSource };
};

export function prettyToolName(name: string): string {
  // "fluid-os-tables_tables_create" -> "tables.create"
  const stripped = name.replace(/^fluid-os-[^_]+_/, "");
  return stripped.replace(/_/g, ".");
}
