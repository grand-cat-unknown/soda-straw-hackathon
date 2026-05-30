import OpenAI from "openai";
import type { Tool } from "openai/resources/responses/responses";

import type { ToolCallTrace } from "@/lib/workspace/types";
import {
  canvasToolDefs,
  canvasToolNames,
} from "@/lib/workspace/canvas-tool-defs";
import {
  catalogToSystemFragment,
  fetchStrawCatalog,
} from "@/lib/soda-straw-catalog";
import { widgetCatalogForPrompt } from "@/components/widgets/widget-contracts";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function optionalMcpTools(): Tool[] {
  const tools: Tool[] = [];

  const sodaStrawApiKey =
    process.env.SODA_STRAW_AGENT_API_KEY ?? process.env.SODA_STRAW_API_KEY;

  if (process.env.SODA_STRAW_MCP_URL && sodaStrawApiKey) {
    tools.push({
      type: "mcp",
      server_label: "soda_straw",
      server_url: process.env.SODA_STRAW_MCP_URL,
      server_description:
        "Governed access to workspace APIs and external services through Soda Straw.",
      authorization: sodaStrawApiKey,
      require_approval: "never",
    });
  }

  return tools;
}

function allTools(): Tool[] {
  const tools = optionalMcpTools();
  for (const def of canvasToolDefs) {
    tools.push(def as unknown as Tool);
  }
  return tools;
}

function tryParseJson(value: string | null | undefined): unknown {
  if (value === null || value === undefined || value === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const BASE_INSTRUCTIONS = [
  "You are the Fluid Modular OS agent.",
  "Every Fluid OS capability is already exposed as a direct Soda Straw MCP tool that you can call right now. Each tool name starts with `fluid-os-<capability>_` — for example, `fluid-os-tables_tables_create` or `fluid-os-canvas_canvas_render`.",
  "Never call Soda Straw discovery tools such as `straws_list`, `straws_tools`, `straws_catalog`, or `whoami`. The catalog is provided below and the tools are pre-attached.",
  "Each request includes the latest Fluid OS canvas snapshot as context. Treat that snapshot as the current workspace state.",
  "You also have live canvas mutation tools that operate directly on the workspace the user is looking at: `canvas_announce_plan`, `canvas_get_state`, `canvas_list_widgets`, `canvas_add_widget`, `canvas_update_widget_input`, `canvas_remove_widget`, `canvas_set_layout`, `canvas_add_bridge`, `canvas_remove_bridge`, `canvas_preview_bridge`, `canvas_list_bridge_suggestions`, `canvas_register_transform`, `canvas_list_transforms`.",
  "For broad, under-specified intents, begin with discovery instead of tools. Ask 2-4 targeted questions that will materially change the workspace. Do not call `canvas_announce_plan`, Soda Straw MCP tools, or canvas mutation tools until the user answers or the request already contains enough constraints.",
  "Use the provided capability catalog, widget contracts, bridge transforms, and current canvas snapshot to decide what to ask. Do not ask generic questions whose answers would not change the workspace.",
  "In discovery, briefly say what workspace you are likely to build after the answers, then ask the questions. Keep the questions concrete and easy to answer. For party planning, prioritize guest count/list source, budget model, date/timeline, venue/food/invites, and what should update live when a user selects guests or tasks.",
  "If the user gives enough detail in the first message, skip discovery and build. If the user explicitly says to just make a reasonable version, skip discovery and build with stated assumptions.",
  "When ready to build a fresh workspace, your VERY FIRST tool call for that build MUST be `canvas_announce_plan`. List every widget you intend to add (with stable ids you will reuse) and every bridge you intend to wire. Only after that call returns may you call `canvas.render` or the `canvas_*` mutation tools to materialize the plan. Reuse the exact widget ids from the plan in your `canvas_add_widget` calls.",
  "BRIDGE REASONING — bridges are the fragile part of the workspace, so think hard before you wire one. Before you announce or add ANY bridge, deliberately reason through these questions and state your reasoning briefly in the plan announcement: (a) What concrete user interaction triggers this bridge? Name the gesture — e.g. \"user clicks a row in the contacts table\". If you can't name the gesture, do not add the bridge. (b) Which exact output port on the source widget fires from that gesture? Look it up in the source widget's contract; do not guess port names. (c) Which exact input port on the target widget consumes it? Look it up in the target contract. (d) Are the two schemas the SAME shape, or do they need a transform? If shapes differ, pick a registered transform or generate one on the go with `canvas_register_transform`; do not drop a useful bridge only because the transform is not pre-bundled. (e) Does the target widget actually need this live input, or is its `bindings` entry already sufficient? Do not bridge data the target already loads itself. (f) Will this bridge cause a feedback loop or overwrite a user edit (e.g. bridging back into a port that the user just typed into)? If yes, drop it. Only bridges that pass all six checks belong in the plan.",
  "ON-THE-GO BRIDGE TRANSFORMS — if a bridge is semantically right but schemas differ and no listed transform fits, call `canvas_register_transform` with pure synchronous JavaScript mapping code, using the source port schema as `input_schema` and target port schema as `output_schema`. Register generated transforms before adding the bridge and call `canvas_preview_bridge` afterward. Generated transform code receives `value` and `params`; `input` is an alias for `value`. Keep it deterministic, local, and side-effect free.",
  "PREFERRED BRIDGE PATTERNS — these are known-stable shapes you should reach for first: (1) singular selection -> detail: source-list `selectedRow`/`selectedMarker`/`selectedItem` -> detail widget's singular `row`/`item`/`marker`/`contact` input with `transform: 'identity'`. (2) multi-selection -> visualization: source-list plural `selectedRows`/`selectedItems` -> a visualization widget's plural input that accepts arrays (e.g. map `markers`, chart `points`). This is the correct shape when the user picks several rows and wants them all reflected somewhere — do NOT collapse a plural selection into a singular detail port, that loses all but the last item. (3) Filter/search widget's `query` output -> list widget's `filter` input. Avoid bridging a list widget's own loaded collection (plural `contacts`, `rows`, `items` outputs that come straight from a binding, not from user selection) into other list inputs — those collections are owned by bindings, not bridges. Avoid bridging into ports whose schema you have not seen in the contract block below. When the schemas don't line up identically but both sides are arrays of records with the right fields, `transform: 'identity'` is fine as long as the required fields are present on the source records; if they aren't, fix the source data (or pick a registered transform) rather than dropping to a singular bridge.",
  "After every incremental `canvas_add_widget` (not part of a freshly-announced plan), call `canvas_list_bridge_suggestions` with the new node id, THEN for each candidate run the six-question bridge check above before calling `canvas_add_bridge`. `canvas_list_bridge_suggestions` returns structurally-compatible matches; many of them are semantically wrong. Skip any suggestion that fails the gesture test (a), the live-need test (e), or the loop test (f). When unsure about the resulting payload, call `canvas_preview_bridge` first.",
  "When the user wants to modify the existing canvas (add a panel, wire a map to a detail view, change an input), prefer the `canvas_*` mutation tools over rebuilding from `canvas.render`.",
  "LAYOUT: the canvas is a fixed 6-column tile grid (cells are ~200px tall). Each widget occupies one tile chosen from a discrete menu of sizes:",
  "  - `small` (1x1) — single-value utilities like calculator, marker-detail, tiny status cards",
  "  - `wide` (2x1) — short horizontal strips, summary bars, compact lists",
  "  - `tall` (1x2) — narrow side panels, vertical lists",
  "  - `medium` (2x2) — default for most lists (notes, tasks, contacts, messages, calendar, forms)",
  "  - `large` (3x2) — half-width content blocks for richer lists or mid-size panels",
  "  - `xlarge` (4x2) — primary content (maps, tables, search results, dashboards)",
  "  - `full` (6x2) — full-width banners, tool results, hero panels",
  "Layout shape is `{ size: <one of the above>, col: 0-5 (left edge), row: 0+ (top edge) }`. The renderer guarantees clean placement: tiles snap to the grid, the agent's requested cell is honored when free, and any collision is auto-bumped to the next first-fit slot. There is no overlap, ever.",
  "Composition guidance:",
  "  - Pick exactly one size per widget from the menu. Do not invent dimensions or pass anything other than the listed sizes.",
  "  - Lead with one anchor (`xlarge` or `full`) and surround it with medium/small companions.",
  "  - Bridged source → detail pairs should sit side-by-side: e.g. map at `{ size: 'xlarge', col: 0, row: 0 }` and marker-detail at `{ size: 'small', col: 4, row: 0 }`.",
  "  - Use `wide` and `tall` to break up monotony when you have several mediums.",
  "  - The order you call `canvas_add_widget` is also the packing order for any tiles that collide — earlier widgets win their requested slot.",
  "You MUST pass `layout` on every `canvas_add_widget` call, or call `canvas_set_layout` immediately after. Unplaced widgets default to `medium` and stack from the top-left.",
  "When announcing the plan, briefly describe the tile arrangement (e.g. \"map xlarge top-left, marker-detail small top-right, notes medium below-left, tasks medium below-right\").",
  "Use `canvas.render` (the Soda Straw tool) only when starting a fresh workspace from a new broad intent. For incremental changes to an existing canvas, use `canvas_add_widget`, `canvas_update_widget_input`, `canvas_add_bridge`, etc.",
  "Before adding a bridge, you may call `canvas_preview_bridge` to verify port compatibility and inspect what the target would receive. If preview says the transform is unknown or incompatible, register a generated transform or fix the transform schema before adding the bridge.",
  "When building a new broad intent after discovery or after receiving enough detail, build a workspace deterministically:",
  "  1. Capture the intent in `notes`.",
  "  2. Create the structured data the workspace needs (tables, contacts, calendar entries, tasks).",
  "  3. Call `canvas.render` LAST to declare the workspace layout, widget nodes, and bridges.",
  "A canvas widget has this generic shape: `{ id, type, title, input, outputs }`.",
  "Backend-backed widgets MUST include `bindings` so they show real data instead of rendering empty. A binding is `{ capabilityId, params, resultPath, transform, refresh }` keyed by the widget input port it fills. Use `refresh: 'onMount'` so the widget loads from the backend by itself on first render.",
  "CRITICAL: whenever a widget contract lists `Tool candidates`, you MUST translate each relevant candidate into a `bindings` entry on `canvas_add_widget`. The candidate `contacts.search -> input.contacts path=$.contacts` becomes `bindings: { contacts: { capabilityId: 'contacts.search', params: {}, resultPath: '$.contacts', refresh: 'onMount' } }`. Never add a widget that has tool candidates without wiring at least one of them — an empty widget is a bug, not a valid state. The only exception is detail widgets that intentionally wait for an upstream bridge selection (e.g. marker-detail, contact-detail) — those still need the binding for any data port that is not fed by a bridge.",
  "For contact widgets, tag filtering is optional. If the user asks for contacts with a specific tag, set the contacts.search binding params to `{ tag: '<tag>' }` or `{ tags: ['<tag>', ...] }`; if they do not ask for a tag, omit those params and show all contacts.",
  "BINDING REFRESH MODES — pick correctly. `onMount` (default): fetch once when the widget appears. Use this for every backend-backed list/detail widget that should display data immediately. `manual`: only ever loads when another widget action explicitly refreshes it; the widget will render empty until then, and there is no built-in refresh button. `afterAction`: re-fetches after a widget action runs. NEVER use `manual` for a widget that the user expects to show data on arrival — that produces an empty widget and is the most common cause of broken workspaces. When in doubt, use `onMount`.",
  "A direct widget action is `{ capabilityId, params, refreshBindings }` keyed by a user action name. Use actions for deterministic UI updates such as toggling tasks or adding table rows; these should not require another model turn.",
  "A bridge has this generic shape: `{ id, from: { node_id, port }, to: { node_id, port }, transform }`.",
  "Match each widget's input shape to the contract declared below. The agent must use exactly the input port names and meanings listed there; never invent ports.",
  "When a backend capability creates or identifies durable data, prefer a widget binding back to the read capability over copying a static snapshot only. For example, after creating a table, render a table widget with `bindings.table = { capabilityId: 'tables.get', params: { table_id }, resultPath: '$', refresh: 'onMount' }` and `actions.addRow = { capabilityId: 'tables.add_row', refreshBindings: ['table'] }` and `actions.deleteRows = { capabilityId: 'tables.delete_rows', refreshBindings: ['table'] }`.",
  "Use bridges for live UI interactions, such as `{ from: { node_id: 'map', port: 'selectedMarker' }, to: { node_id: 'detail', port: 'marker' }, transform: 'identity' }`.",
  "Prefer creating concrete data over describing it once the build has started. Before the build starts, ask discovery questions whenever missing constraints would materially change the workspace.",
  "Do not claim to have done something unless a tool call actually did it.",
].join(" ");

const WIDGET_CATALOG_FRAGMENT = widgetCatalogForPrompt();

async function buildInstructions(): Promise<string> {
  const catalog = await fetchStrawCatalog();
  const fragment = catalogToSystemFragment(catalog);
  const parts = [BASE_INSTRUCTIONS, WIDGET_CATALOG_FRAGMENT];
  if (fragment) parts.push(fragment);
  return parts.join("\n\n");
}

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { role?: unknown; content?: unknown };
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

function normalizeConversation(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isConversationMessage)
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);
}

function buildInput(
  message: string,
  canvas: unknown,
  conversation: ConversationMessage[],
): string {
  return [
    "Active space conversation history:",
    conversation.length > 0
      ? conversation
          .map((entry) => `${entry.role.toUpperCase()}:\n${entry.content}`)
          .join("\n\n")
      : "(No previous messages in this space.)",
    "",
    `Current user request:\n${message}`,
    "",
    "Current canvas snapshot, which is the authoritative workspace state:",
    JSON.stringify(canvas ?? null),
  ].join("\n");
}

export type CanvasToolCall = {
  call_id: string;
  name: string;
  arguments: unknown;
};

export type CanvasToolOutput = {
  call_id: string;
  name: string;
  output: unknown;
};

export type StreamEvent =
  | { type: "text.delta"; delta: string }
  | { type: "tool.start"; id: string; name: string; server_label: string }
  | { type: "tool.done"; trace: ToolCallTrace }
  | { type: "canvas_tool.call"; call: CanvasToolCall }
  | { type: "response.id"; id: string }
  | { type: "awaiting_canvas_tools"; response_id: string }
  | { type: "done" }
  | { type: "error"; message: string };

type ChatRequestBody =
  | {
      message: string;
      canvas?: unknown;
      conversation?: ConversationMessage[];
    }
  | {
      previous_response_id: string;
      canvas_tool_outputs: CanvasToolOutput[];
    };

function isContinuation(body: unknown): body is {
  previous_response_id: string;
  canvas_tool_outputs: CanvasToolOutput[];
} {
  return Boolean(
    body &&
      typeof body === "object" &&
      "previous_response_id" in body &&
      "canvas_tool_outputs" in body,
  );
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY in os/.env" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as ChatRequestBody;
  const continuation = isContinuation(body);

  if (!continuation) {
    const { message } = body as { message?: unknown };
    if (typeof message !== "string" || message.trim().length === 0) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }
  }

  const tools = allTools();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      const pendingMcpCalls = new Map<
        string,
        { name: string; server_label: string }
      >();
      let emittedCanvasCallCount = 0;

      try {
        let openaiStream;

        if (continuation) {
          const { previous_response_id, canvas_tool_outputs } = body as {
            previous_response_id: string;
            canvas_tool_outputs: CanvasToolOutput[];
          };
          const input = canvas_tool_outputs.map((out) => ({
            type: "function_call_output" as const,
            call_id: out.call_id,
            output:
              typeof out.output === "string"
                ? out.output
                : JSON.stringify(out.output ?? null),
          }));
          openaiStream = await openai.responses.create({
            model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
            previous_response_id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            input: input as any,
            tools: tools.length > 0 ? tools : undefined,
            stream: true,
          });
        } else {
          const { message, canvas } = body as {
            message: string;
            canvas?: unknown;
            conversation?: unknown;
          };
          const conversation = normalizeConversation(
            (body as { conversation?: unknown }).conversation,
          );
          const instructions = await buildInstructions();
          openaiStream = await openai.responses.create({
            model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
            instructions,
            input: buildInput(message.trim(), canvas, conversation),
            tools: tools.length > 0 ? tools : undefined,
            stream: true,
          });
        }

        let responseId: string | null = null;

        for await (const event of openaiStream) {
          switch (event.type) {
            case "response.created": {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const created = (event as any).response;
              if (created?.id) {
                responseId = created.id;
                send({ type: "response.id", id: created.id });
              }
              break;
            }
            case "response.output_text.delta": {
              send({ type: "text.delta", delta: event.delta });
              break;
            }
            case "response.output_item.added": {
              const item = event.item;
              if (item.type === "mcp_call") {
                pendingMcpCalls.set(item.id, {
                  name: item.name,
                  server_label: item.server_label,
                });
                send({
                  type: "tool.start",
                  id: item.id,
                  name: item.name,
                  server_label: item.server_label,
                });
              }
              break;
            }
            case "response.output_item.done": {
              const item = event.item;
              if (item.type === "mcp_call") {
                pendingMcpCalls.delete(item.id);
                send({
                  type: "tool.done",
                  trace: {
                    id: item.id,
                    server_label: item.server_label,
                    name: item.name,
                    arguments: tryParseJson(item.arguments),
                    output: tryParseJson(item.output ?? null),
                    error: item.error ?? null,
                  },
                });
              } else if (item.type === "function_call") {
                if (canvasToolNames.has(item.name)) {
                  send({
                    type: "canvas_tool.call",
                    call: {
                      call_id: item.call_id,
                      name: item.name,
                      arguments: tryParseJson(item.arguments),
                    },
                  });
                  emittedCanvasCallCount += 1;
                }
              }
              break;
            }
            default:
              break;
          }
        }

        if (responseId && emittedCanvasCallCount > 0) {
          send({ type: "awaiting_canvas_tools", response_id: responseId });
        }
        send({ type: "done" });
      } catch (caughtError) {
        send({
          type: "error",
          message:
            caughtError instanceof Error
              ? caughtError.message
              : "Stream failed.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
