# Backend

This is the local FastAPI capability server for the hackathon prototype.

It behaves like a small local API/MCP hub: the OS can ask what capabilities exist, then call endpoints for contacts, calendar events, tasks, tables, notes, files, search, maps, calculator, forms, canvas, messages, and shadcn-backed UI components.

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
uv sync --project backend
```

Then run from the repo root:

```sh
uv run --project backend uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8787
```

Or, from the repo root, run the backend and expose all tool prefixes publicly through ngrok:

```sh
./backend/launch-backend-ngrok.sh
```

The public launcher defaults to this static ngrok dev domain:

```txt
https://uncombed-wand-unfitted.ngrok-free.dev
```

Override it with `NGROK_URL` if you ever switch domains.

The launcher reads local backend environment variables from `backend/.env`.

To reset the matching Soda Straw straws after ngrok is live, pass a Soda Straw API key and set `SODA_STRAW_RESET`:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key SODA_STRAW_RESET=1 ./backend/launch-backend-ngrok.sh
```

You can generate a Soda Straw API key from `https://srikanthganta.straw.demo.soda.io/connect`.

The reset deletes existing `fluid-os-*` straws, discovers tools from `GET /tools`, and creates one Generic API straw per tool prefix. To run only the Soda Straw sync against an already-running backend:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key backend/scripts/sync_soda_straw_straws.py
```

Set `SODA_STRAW_DRY_RUN=1` to preview the reset. Set `SODA_STRAW_DELETE_ALL=1` only if you really want to delete every straw in the workspace before recreating the Fluid OS tools.

Or run directly with UV from `backend/`:

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
FLUID_OS_API_KEY=your-secret-key uv run --project backend uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8787
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
- `GET /tables/health`
- `GET /tables/openapi.json`
- `GET /notes/health`
- `GET /notes/openapi.json`
- `GET /files/health`
- `GET /files/openapi.json`
- `GET /search/health`
- `GET /search/openapi.json`
- `GET /maps/health`
- `GET /maps/openapi.json`
- `GET /calculator/health`
- `GET /calculator/openapi.json`
- `GET /forms/health`
- `GET /forms/openapi.json`
- `GET /canvas/health`
- `GET /canvas/openapi.json`
- `GET /messages/health`
- `GET /messages/openapi.json`
- `GET /shadcn/health`
- `GET /shadcn/openapi.json`

Tool calls, with `X-API-Key`:

- `GET /contacts`
- `GET /contacts/{contact_id}`
- `GET /calendar/events`
- `POST /calendar/events`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/{task_id}`
- `POST /tables`
- `POST /maps/places/search`
- `POST /calculator/compute`
- `POST /canvas/render`
- `POST /messages/draft`
- `GET /shadcn/tools`

For a hub or reverse proxy, each tool can be registered with:

```txt
Base server: http://localhost:8787/{tool}
OpenAPI:     http://localhost:8787/{tool}/openapi.json
Auth:        X-API-Key: fluid-os-dev-key
```

All data is mocked and safe to change.

## Add A New Fake Tool

See `backend/app/tools/README.md`.
