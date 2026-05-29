import OpenAI from "openai";
import type { Tool } from "openai/resources/responses/responses";

import { callShadcnTool, getShadcnOpenAITools } from "@/lib/shadcn-mcp";

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

function getFunctionCalls(response: OpenAI.Responses.Response) {
  return response.output.filter((item) => item.type === "function_call");
}

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

  const tools = [...optionalMcpTools(), ...(await getShadcnOpenAITools())];

  let response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    instructions:
      "You are a concise local app agent. Use Soda Straw MCP for external service or workspace data lookups when available. Use shadcn tools for component registry work and component installation when available. Do not claim to have changed files unless a tool call actually did it.",
    input: message.trim(),
    tools: tools.length > 0 ? tools : undefined,
  });

  for (let i = 0; i < 4; i += 1) {
    const functionCalls = getFunctionCalls(response);

    if (functionCalls.length === 0) {
      break;
    }

    const toolOutputs = await Promise.all(
      functionCalls.map(async (toolCall) => {
        try {
          if (toolCall.name.startsWith("shadcn__")) {
            return {
              type: "function_call_output" as const,
              call_id: toolCall.call_id,
              output: await callShadcnTool(toolCall.name, toolCall.arguments),
            };
          }

          throw new Error(`Unhandled function tool: ${toolCall.name}`);
        } catch (error) {
          return {
            type: "function_call_output" as const,
            call_id: toolCall.call_id,
            output: JSON.stringify({
              error:
                error instanceof Error ? error.message : "Tool call failed.",
            }),
          };
        }
      }),
    );

    response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      previous_response_id: response.id,
      input: toolOutputs,
      tools: tools.length > 0 ? tools : undefined,
    });
  }

  return Response.json({ reply: response.output_text });
}
