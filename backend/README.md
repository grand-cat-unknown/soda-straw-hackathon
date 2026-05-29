# Backend

This is the local FastAPI capability server for the hackathon prototype.

It behaves like a small local API/MCP hub: the OS can ask what capabilities exist, then call endpoints for contacts, calendar events, tasks, budgets, shopping, and messages.

The data is fake, but the API should behave like a real service:

- Stable routes
- Correct HTTP methods
- Shared `X-API-Key` auth for every tool endpoint
- JSON request bodies for writes/actions
- Valid JSON error responses
- Basic request validation
- Capability metadata with input/output schemas
- An OpenAPI-style spec at `GET /openapi.json`
- Per-tool OpenAPI specs at `GET /{tool}/openapi.json`

Each fake API is a separate module in `backend/app/tools`, so new capabilities can be added without editing the main server router.

## Run

Install dependencies once:

```sh
npm run setup:backend
```

Or directly with UV:

```sh
uv sync --project backend
```

Then run from the repo root:

```sh
npm run backend
```

Or from this folder:

```sh
npm run dev
```

Or directly with UV from `backend/`:

```sh
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8787
```

The server runs on:

```txt
http://localhost:8787
```

FastAPI docs are available at:

```txt
http://localhost:8787/docs
```

## Auth

All tool, registry, and capability endpoints use the same header:

```txt
X-API-Key: fluid-os-dev-key
```

Override it with:

```sh
FLUID_OS_API_KEY=your-secret-key npm run backend
```

## Useful Endpoints

Public:

- `GET /health`
- `GET /docs`
- `GET /openapi.json`

Registry, with `X-API-Key`:

- `GET /tools`
- `GET /capabilities`

Tool metadata, with `X-API-Key`:

- `GET /contacts/health`
- `GET /contacts/openapi.json`
- `GET /calendar/health`
- `GET /calendar/openapi.json`
- `GET /tasks/health`
- `GET /tasks/openapi.json`
- `GET /shopping/health`
- `GET /shopping/openapi.json`
- `GET /budget/health`
- `GET /budget/openapi.json`
- `GET /messages/health`
- `GET /messages/openapi.json`
- `GET /actions/health`
- `GET /actions/openapi.json`

Tool calls, with `X-API-Key`:

- `GET /contacts`
- `GET /contacts/{contact_id}`
- `GET /calendar/events`
- `POST /calendar/events`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/{task_id}`
- `GET /shopping/search?q=snacks`
- `POST /budget/estimate`
- `POST /messages/draft`
- `POST /actions/simulate`

For a hub or reverse proxy, each tool can be registered with:

```txt
Base server: http://localhost:8787/{tool}
OpenAPI:     http://localhost:8787/{tool}/openapi.json
Auth:        X-API-Key: fluid-os-dev-key
```

All data is mocked and safe to change.

## Add A New Fake Tool

See `backend/app/tools/README.md`.
