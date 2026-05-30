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
  "You also have live canvas mutation tools that operate directly on the workspace the user is looking at: `canvas_get_state`, `canvas_list_widgets`, `canvas_add_widget`, `canvas_update_widget_input`, `canvas_remove_widget`, `canvas_set_layout`, `canvas_add_bridge`, `canvas_remove_bridge`, `canvas_preview_bridge`, `canvas_list_transforms`.",
  "When the user wants to modify the existing canvas (add a panel, wire a map to a detail view, change an input), prefer the `canvas_*` mutation tools over rebuilding from `canvas.render`.",
  "Use `canvas.render` (the Soda Straw tool) only when starting a fresh workspace from a new broad intent. For incremental changes to an existing canvas, use `canvas_add_widget`, `canvas_update_widget_input`, `canvas_add_bridge`, etc.",
  "Before adding a bridge, you may call `canvas_preview_bridge` to verify port compatibility and inspect what the target would receive.",
  "When the user states a new broad intent, build a workspace deterministically:",
  "  1. Capture the intent in `notes`.",
  "  2. Create the structured data the workspace needs (tables, contacts, calendar entries, tasks).",
  "  3. Call `canvas.render` LAST to declare the workspace layout, widget nodes, and bridges.",
  "A canvas widget has this generic shape: `{ id, type, title, input, outputs }`.",
  "A bridge has this generic shape: `{ id, from: { node_id, port }, to: { node_id, port }, transform }`.",
  "Use widget inputs that are already shaped for the widget. For example, a `map` widget expects `input.markers` as `{ id, lng, lat, label? }[]` and optional `input.route`; a `table` widget expects `input.table`; a `marker-detail` widget expects `input.marker`; a `tool-result` widget expects `input.value`.",
  "Use bridges for live UI interactions, such as `{ from: { node_id: 'map', port: 'selectedMarker' }, to: { node_id: 'detail', port: 'marker' }, transform: 'identity' }`.",
  "Prefer creating concrete data over describing it. Only ask clarifying questions if a critical field is missing.",
  "Do not claim to have done something unless a tool call actually did it.",
].join(" ");

async function buildInstructions(): Promise<string> {
  const catalog = await fetchStrawCatalog();
  const fragment = catalogToSystemFragment(catalog);
  return fragment ? `${BASE_INSTRUCTIONS}\n\n${fragment}` : BASE_INSTRUCTIONS;
}

function buildInput(message: string, canvas: unknown): string {
  return [
    `User request:\n${message}`,
    "",
    "Current canvas snapshot:",
    JSON.stringify(canvas ?? null, null, 2),
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
          };
          const instructions = await buildInstructions();
          openaiStream = await openai.responses.create({
            model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
            instructions,
            input: buildInput(message.trim(), canvas),
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
