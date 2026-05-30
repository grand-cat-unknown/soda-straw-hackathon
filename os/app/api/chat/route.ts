import OpenAI from "openai";
import type { Tool } from "openai/resources/responses/responses";

import type { ToolCallTrace } from "@/lib/workspace";
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
  "When the user states an intent, build a workspace deterministically:",
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

export type StreamEvent =
  | { type: "text.delta"; delta: string }
  | { type: "tool.start"; id: string; name: string; server_label: string }
  | { type: "tool.done"; trace: ToolCallTrace }
  | { type: "done" }
  | { type: "error"; message: string };

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY in os/.env" },
      { status: 500 },
    );
  }

  const { message } = (await request.json()) as { message?: unknown };

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const tools = optionalMcpTools();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      const pendingCalls = new Map<
        string,
        { name: string; server_label: string }
      >();

      try {
        const instructions = await buildInstructions();
        const openaiStream = await openai.responses.create({
          model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
          instructions,
          input: message.trim(),
          tools: tools.length > 0 ? tools : undefined,
          stream: true,
        });

        for await (const event of openaiStream) {
          switch (event.type) {
            case "response.output_text.delta": {
              send({ type: "text.delta", delta: event.delta });
              break;
            }
            case "response.output_item.added": {
              if (event.item.type === "mcp_call") {
                pendingCalls.set(event.item.id, {
                  name: event.item.name,
                  server_label: event.item.server_label,
                });
                send({
                  type: "tool.start",
                  id: event.item.id,
                  name: event.item.name,
                  server_label: event.item.server_label,
                });
              }
              break;
            }
            case "response.output_item.done": {
              if (event.item.type === "mcp_call") {
                pendingCalls.delete(event.item.id);
                send({
                  type: "tool.done",
                  trace: {
                    id: event.item.id,
                    server_label: event.item.server_label,
                    name: event.item.name,
                    arguments: tryParseJson(event.item.arguments),
                    output: tryParseJson(event.item.output ?? null),
                    error: event.item.error ?? null,
                  },
                });
              }
              break;
            }
            default:
              break;
          }
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
