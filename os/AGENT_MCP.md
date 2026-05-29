# Agent MCP Plan

The browser UI should stay thin: it sends the prompt to the Next.js API route.
All OpenAI, Soda Straw, and MCP credentials should stay on the server.

## Recommended Shape

1. Next.js API route calls the OpenAI Responses API.
2. The API route attaches remote MCP tools only from server environment variables.
3. Soda Straw is exposed through a scoped Soda Straw agent API key, not a personal key.
4. shadcn is exposed through the FastAPI backend as a regular tool (`/shadcn/*`),
   which fronts the official `npx shadcn@latest mcp` stdio server. Soda Straw
   picks it up via the same straw sync that registers every other backend tool.

## Why

Soda Straw is the right place for governed external services: credentials,
permissions, audit, and revocation live there. This workspace already exposes
the Fluid OS APIs as Soda Straw straws, so the chat agent should reach them
through the Soda Straw MCP endpoint.

shadcn used to be wired as a local OpenAI function tool inside the Next.js
route. That made it available only to this one app and required separate
plumbing. Moving it behind the backend's `/shadcn/tools` and `/shadcn/call`
endpoints means it shows up in `GET /tools` and `GET /capabilities` exactly
like contacts, calendar, etc., gets registered as a Soda Straw straw by
`sync_soda_straw_straws.py`, and any consumer that already speaks to Soda Straw
gets shadcn for free. The backend keeps the long-lived stdio MCP subprocess.

## Environment Variables

```bash
# os/.env.local
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini

SODA_STRAW_MCP_URL=https://srikanthganta.straw.demo.soda.io/mcp
SODA_STRAW_AGENT_API_KEY=...
```

```bash
# backend/.env (optional)
# Override the project directory the shadcn MCP server operates on.
# Defaults to the sibling `os/` Next.js project in this repo.
SHADCN_PROJECT_CWD=/absolute/path/to/your/next/app
```

## Next Step

For production, create a dedicated Soda Straw agent with only the straws this UI
needs, mint an agent API key, and put that key in `os/.env.local`. For shadcn,
consider putting a human approval layer in front of write-capable tools (the
shadcn CLI can write component files into whatever project `SHADCN_PROJECT_CWD`
points at) before exposing the backend beyond localhost.
