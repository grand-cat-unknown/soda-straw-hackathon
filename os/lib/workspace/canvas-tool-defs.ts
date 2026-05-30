import { widgetContracts } from "@/lib/workspace/contracts";
import { TILE_DIMENSIONS } from "@/lib/workspace/types";

const TILE_SIZES = Object.keys(TILE_DIMENSIONS);

const layoutSchema = {
  type: "object",
  description:
    "Tile placement on the 6-column canvas grid. `size` picks the tile shape, `col` is 0-5 (left cell), `row` is 0+ (top cell).",
  properties: {
    size: { type: "string", enum: TILE_SIZES },
    col: { type: "number", minimum: 0, maximum: 5 },
    row: { type: "number", minimum: 0 },
  },
  required: ["size", "col", "row"],
  additionalProperties: false,
};

export type CanvasToolName =
  | "canvas_announce_plan"
  | "canvas_get_state"
  | "canvas_list_widgets"
  | "canvas_add_widget"
  | "canvas_update_widget_input"
  | "canvas_remove_widget"
  | "canvas_set_layout"
  | "canvas_add_bridge"
  | "canvas_remove_bridge"
  | "canvas_preview_bridge"
  | "canvas_list_bridge_suggestions"
  | "canvas_register_transform"
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
    name: "canvas_announce_plan",
    description:
      "Announce the workspace plan BEFORE building anything. MUST be your first tool call when the user states a new broad intent. Lists the widgets you intend to add and the bridges you intend to wire between them so the user can see the plan in chat. Does not mutate the canvas. Bridges are the most fragile piece of the workspace: before listing one here, you MUST mentally walk through the six bridge-reasoning checks (gesture, source port exists in contract, target port exists in contract, schema match or registered/generated transform, target actually needs live input rather than a binding, no feedback loop) and only include bridges that pass all six. Prefer fewer, correct bridges over many speculative ones; when the only missing piece is a transform, plan the bridge and register that transform before adding the bridge.",
    parameters: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "Restate the user's intent in one sentence.",
        },
        widgets: {
          type: "array",
          description:
            "Widgets you plan to add. Use the same id values in subsequent canvas_add_widget calls.",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: widgetTypes },
              title: { type: "string" },
              rationale: {
                type: "string",
                description: "One-line reason this widget is in the plan.",
              },
            },
            required: ["id", "type", "title", "rationale"],
            additionalProperties: false,
          },
        },
        bridges: {
          type: "array",
          description: "Bridges you plan to create between the planned widgets.",
          items: {
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
              transform: { type: "string" },
              rationale: {
                type: "string",
                description:
                  "Explicit per-bridge reasoning. MUST cover: (1) the user gesture that triggers it, (2) why this exact source port fires on that gesture, (3) why the target needs this live input instead of relying on its own binding, (4) schema compatibility (identity, registered transform, or generated transform needed). One or two sentences is fine, but all four points must be present.",
              },
            },
            required: ["from", "to", "rationale"],
            additionalProperties: false,
          },
        },
        notes: {
          type: "string",
          description:
            "Optional notes, e.g. why no widget fits, or caveats about the plan.",
        },
      },
      required: ["intent", "widgets", "bridges"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_get_state",
    description:
      "Return the current live canvas state: nodes, edges, outputs, layout, widget contracts, and registered transforms.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "canvas_list_widgets",
    description:
      "Return a compact list of live canvas widgets with ids, types, titles, inputs, outputs, layout, and contracts.",
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
            "Initial view config or seed data shaped for the widget contract. Prefer bindings for backend-backed data.",
          additionalProperties: true,
        },
        bindings: {
          type: "object",
          description:
            "Backend data bindings keyed by widget input port. Each binding uses capabilityId, params, resultPath, transform, and refresh.",
          additionalProperties: true,
        },
        actions: {
          type: "object",
          description:
            "Direct widget actions keyed by action name. Each action uses capabilityId, params, and refreshBindings.",
          additionalProperties: true,
        },
        layout: layoutSchema,
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
    description:
      "Set the tile layout for a widget. layout = { size, col, row } on the 6-column grid.",
    parameters: {
      type: "object",
      properties: {
        node_id: { type: "string" },
        layout: layoutSchema,
      },
      required: ["node_id", "layout"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_add_bridge",
    description:
      "Create a bridge from a source output port to a target input port. Returns the bridge id or a rejection reason. Before calling, you must have walked through the six bridge-reasoning checks: (1) a real user gesture triggers it, (2) the source port fires on that gesture, (3) the target port exists in its contract, (4) schemas match or a registered/generated transform bridges them, (5) the target genuinely needs live input (not just its binding), (6) no feedback loop. If schemas differ and no listed transform fits, call canvas_register_transform first with generated mapping code, then preview this bridge. Wrong bridges are worse than missing ones.",
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
    name: "canvas_list_bridge_suggestions",
    description:
      "After adding a widget, list candidate bridges discovered by schema-matching the new widget's ports against existing widgets. Each suggestion is structurally valid; you must still judge whether it is semantically right before calling canvas_add_bridge.",
    parameters: {
      type: "object",
      properties: {
        node_id: {
          type: "string",
          description:
            "The widget id to find candidate bridges for (usually the one you just added).",
        },
      },
      required: ["node_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "canvas_register_transform",
    description:
      "Register an on-the-go synchronous JavaScript transform for bridge payloads when no existing transform fits. The generated code receives `value` and `params`; `input` is an alias for `value`. Use a pure expression or a function body with `return`. Do not perform I/O or read browser globals. After registering, call canvas_preview_bridge before canvas_add_bridge.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description:
            "Stable transform id, e.g. `generated.contactsToMarkers`. Use the same id in bridge.transform.",
        },
        description: { type: "string" },
        input_schema: {
          type: "object",
          description:
            "JSON schema for accepted source payload. Use the source port schema when available.",
          additionalProperties: true,
        },
        output_schema: {
          type: "object",
          description:
            "JSON schema for produced target payload. Use the target port schema when available.",
          additionalProperties: true,
        },
        source: {
          type: "string",
          description:
            "Pure JavaScript expression or return-body. Example: `Array.isArray(value) ? value.map((x, i) => ({ id: String(x.id ?? i), lat: Number(x.lat), lng: Number(x.lng), label: String(x.name ?? x.label ?? '') })) : []`.",
        },
        sample_value: {
          type: ["object", "array", "string", "number", "boolean", "null"],
          description:
            "Optional sample payload to run immediately as a smoke test.",
        },
      },
      required: ["id", "input_schema", "output_schema", "source"],
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
