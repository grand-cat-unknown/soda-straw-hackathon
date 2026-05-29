import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool as OpenAITool } from "openai/resources/responses/responses";

type ToolMap = Map<string, string>;

let clientPromise: Promise<Client> | null = null;
let toolMapPromise: Promise<ToolMap> | null = null;

function isEnabled() {
  return process.env.ENABLE_SHADCN_MCP !== "false";
}

function toFunctionName(name: string) {
  return `shadcn__${name.replace(/[^a-zA-Z0-9_-]/g, "_")}`.slice(0, 64);
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new Client({
        name: "fluid-os-shadcn-client",
        version: "0.1.0",
      });

      const transport = new StdioClientTransport({
        command: process.platform === "win32" ? "npx.cmd" : "npx",
        args: ["shadcn@latest", "mcp", "--cwd", process.cwd()],
        cwd: process.cwd(),
        stderr: "pipe",
      });

      transport.stderr?.on("data", (chunk) => {
        console.warn(`[shadcn-mcp] ${chunk.toString().trim()}`);
      });

      await client.connect(transport);
      return client;
    })();
  }

  return clientPromise;
}

export async function getShadcnOpenAITools(): Promise<OpenAITool[]> {
  if (!isEnabled()) {
    return [];
  }

  const client = await getClient();
  const result = await client.listTools();
  const map = new Map<string, string>();

  const tools = result.tools.map((tool) => {
    const functionName = toFunctionName(tool.name);
    map.set(functionName, tool.name);

    return {
      type: "function" as const,
      name: functionName,
      description: tool.description ?? `Call the shadcn MCP tool ${tool.name}.`,
      parameters: tool.inputSchema ?? {
        type: "object",
        properties: {},
        additionalProperties: true,
      },
      strict: false,
    };
  });

  toolMapPromise = Promise.resolve(map);
  return tools;
}

export async function callShadcnTool(functionName: string, argsJson: string) {
  const client = await getClient();
  const toolMap = await toolMapPromise;
  const toolName = toolMap?.get(functionName);

  if (!toolName) {
    throw new Error(`Unknown shadcn MCP tool: ${functionName}`);
  }

  const args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  const result = await client.callTool({
    name: toolName,
    arguments: args,
  });

  return JSON.stringify(result);
}
