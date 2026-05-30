import { widgetContracts } from "@/lib/workspace/contracts";

export type CanvasToolName =
  | "canvas_get_state"
  | "canvas_add_widget"
  | "canvas_update_widget_input"
  | "canvas_remove_widget"
  | "canvas_set_layout"
  | "canvas_add_bridge"
  | "canvas_remove_bridge"
  | "canvas_preview_bridge"
  | "canvas_list_transforms";

export type CanvasToolDef = {
  type: "function";
  name: CanvasToolName;
  description: string;
  parameters: Record<string, unknown>;
};

const widgetTypes = Object.keys(widgetContracts);

export const canvasToolDefs: CanvasToolDef[] = [
  {
    type: "function",
    name: "canvas_get_state",
    description:
      "Return the current live canvas state: nodes, edges, outputs, layout, widget contracts, and registered transforms.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "canvas_add_widget",
    description:
      "Add a widget node to the live canvas. Returns the new node id.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Optional stable id." },
        type: {
          type: "string",
          enum: widgetTypes,
          description: "Widget type from the contract registry.",
        },
        title: { type: "string" },
        input: {
          type: "object",
          description:
            "Initial input shaped for the widget contract (e.g. { markers: [...] } for a map).",
          additionalProperties: true,
        },
        layout: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            w: { type: "number" },
            h: { type: "number" },
          },
          required: ["x", "y", "w", "h"],
          additionalProperties: false,
        },
      },
      required: ["type"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_update_widget_input",
    description: "Merge new values into an existing widget's input.",
    parameters: {
      type: "object",
      properties: {
        node_id: { type: "string" },
        input: { type: "object", additionalProperties: true },
      },
      required: ["node_id", "input"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_remove_widget",
    description: "Remove a widget and any bridges attached to it.",
    parameters: {
      type: "object",
      properties: { node_id: { type: "string" } },
      required: ["node_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_set_layout",
    description: "Set the layout (x, y, w, h) for a widget.",
    parameters: {
      type: "object",
      properties: {
        node_id: { type: "string" },
        layout: {
          type: "object",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            w: { type: "number" },
            h: { type: "number" },
          },
          required: ["x", "y", "w", "h"],
          additionalProperties: false,
        },
      },
      required: ["node_id", "layout"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_add_bridge",
    description:
      "Create a bridge from a source output port to a target input port. Returns the bridge id or a rejection reason.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        from: {
          type: "object",
          properties: {
            node_id: { type: "string" },
            port: { type: "string" },
          },
          required: ["node_id", "port"],
          additionalProperties: false,
        },
        to: {
          type: "object",
          properties: {
            node_id: { type: "string" },
            port: { type: "string" },
          },
          required: ["node_id", "port"],
          additionalProperties: false,
        },
        transform: {
          type: ["string", "object", "null"],
          description:
            "Optional transform id (e.g. 'identity', 'pickField') or { id, params }.",
        },
      },
      required: ["from", "to"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_remove_bridge",
    description: "Remove a bridge by id.",
    parameters: {
      type: "object",
      properties: { bridge_id: { type: "string" } },
      required: ["bridge_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_preview_bridge",
    description:
      "Validate a hypothetical bridge and, if compatible, return the value the target would receive based on the source's latest output. Does not mutate state.",
    parameters: {
      type: "object",
      properties: {
        from: {
          type: "object",
          properties: {
            node_id: { type: "string" },
            port: { type: "string" },
          },
          required: ["node_id", "port"],
          additionalProperties: false,
        },
        to: {
          type: "object",
          properties: {
            node_id: { type: "string" },
            port: { type: "string" },
          },
          required: ["node_id", "port"],
          additionalProperties: false,
        },
        transform: { type: ["string", "object", "null"] },
      },
      required: ["from", "to"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_list_transforms",
    description: "List registered transforms with their input/output schemas.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
];

export const canvasToolNames = new Set<string>(
  canvasToolDefs.map((t) => t.name),
);
