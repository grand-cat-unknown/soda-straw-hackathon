# Agent MCP Plan

The browser UI should stay thin: it sends the prompt to the Next.js API route.
All OpenAI, Soda Straw, and MCP credentials should stay on the server.

## Recommended Shape

1. Next.js API route calls the OpenAI Responses API.
2. The API route attaches remote MCP tools only from server environment variables.
3. Soda Straw is exposed through a scoped Soda Straw agent API key, not a personal key.
4. shadcn runs locally through the official `npx shadcn@latest mcp` stdio server.

## Why

Soda Straw is the right place for governed external services: credentials,
permissions, audit, and revocation live there. This workspace already exposes
the Fluid OS APIs as Soda Straw straws, so the chat agent should reach them
through the Soda Straw MCP endpoint.

shadcn is different. Its MCP server bridges registries and the shadcn CLI, and
it can write component files into the project. That is a local workspace
capability, not really a shared SaaS credential. The Next API route starts the
official shadcn MCP process on demand and exposes its tools to the model as
local OpenAI function tools. This avoids trying to expose `localhost` as a
remote MCP server to the OpenAI API.

## Environment Variables

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini

SODA_STRAW_MCP_URL=https://srikanthganta.straw.demo.soda.io/mcp
SODA_STRAW_AGENT_API_KEY=...

ENABLE_SHADCN_MCP=true
```

## Next Step

For production, create a dedicated Soda Straw agent with only the straws this UI
needs, mint an agent API key, and put that key in `os/.env.local`. For shadcn,
keep the local function-tool adapter for development, or put a human approval
layer in front of write-capable tools before exposing it beyond localhost.
