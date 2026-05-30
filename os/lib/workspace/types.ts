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

export type ToolBindingRefresh = "onMount" | "manual" | "afterAction";

export type ToolBinding = {
  capabilityId: string;
  toolName?: string;
  params?: Record<string, unknown>;
  resultPath?: string;
  transform?: string;
  refresh?: ToolBindingRefresh;
};

export type ToolAction = {
  capabilityId: string;
  toolName?: string;
  params?: Record<string, unknown>;
  inputMap?: Record<string, string>;
  refreshBindings?: string[];
};

export type WidgetToolCandidate = {
  capabilityId: string;
  inputPort: Port;
  resultPath?: string;
  purpose: string;
  transform?: string;
};

export type WidgetContract = {
  type: WidgetType;
  title: string;
  description: string;
  inputs: Record<string, WidgetPortContract>;
  outputs: Record<string, WidgetPortContract>;
  render: WidgetRenderContract;
  toolCandidates?: WidgetToolCandidate[];
  toolActions?: Record<string, ToolAction>;
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
  bindings?: Record<string, ToolBinding>;
  actions?: Record<string, ToolAction>;
};

export type WidgetComponentProps<TInput extends WidgetInput = WidgetInput> = {
  node: WidgetNode;
  input: TInput;
  emitOutput: (port: Port, value: unknown) => void;
  runAction: (
    actionName: string,
    payload?: Record<string, unknown>,
  ) => Promise<unknown>;
  refreshBindings: (bindingNames?: string[]) => Promise<void>;
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

// Tile sizes on the 6-column canvas grid. Each tile is { cols x rows } in cells.
// Cell width = 1/6 of canvas; cell height = ~200px.
export type TileSize =
  | "small" // 1 x 1
  | "wide" // 2 x 1
  | "tall" // 1 x 2
  | "medium" // 2 x 2
  | "large" // 3 x 2
  | "xlarge" // 4 x 2
  | "full"; // 6 x 2

export type CanvasLayout = {
  size: TileSize;
  col: number; // 0-5, top-left cell column
  row: number; // >= 0, top-left cell row
};

export const TILE_DIMENSIONS: Record<TileSize, { cols: number; rows: number }> = {
  small: { cols: 1, rows: 1 },
  wide: { cols: 2, rows: 1 },
  tall: { cols: 1, rows: 2 },
  medium: { cols: 2, rows: 2 },
  large: { cols: 3, rows: 2 },
  xlarge: { cols: 4, rows: 2 },
  full: { cols: 6, rows: 2 },
};

export const CANVAS_COLS = 6;

export type CanvasMutationSource = "agent" | "user" | "tool";

export type CanvasPlanWidget = {
  id: string;
  type: WidgetType;
  title: string;
  rationale: string;
};

export type CanvasPlanBridge = {
  from: { nodeId: string; port: string };
  to: { nodeId: string; port: string };
  transform?: string;
  rationale: string;
};

export type CanvasPlan = {
  id: string;
  intent: string;
  widgets: CanvasPlanWidget[];
  bridges: CanvasPlanBridge[];
  notes?: string;
};

export type BridgeSuggestion = {
  from: { nodeId: NodeId; port: Port };
  to: { nodeId: NodeId; port: Port };
  fromType: WidgetType;
  toType: WidgetType;
  transform?: TransformRef;
  score: number;
};

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
