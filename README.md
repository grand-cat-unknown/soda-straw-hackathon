# Fluid OS

Prototype repo for Fluid OS: an intent-driven operating surface that assembles
widgets, bridges, and Soda Straw-backed tool calls around what the user wants to
do.

Fluid OS treats Soda Straw as the capability backbone for MCPs, APIs, databases,
and external tools. The OS layer then builds ephemeral workspaces from
deterministic widgets, wiring them together on the fly for the current task.

Read the deeper project framing in [`os/README.md`](os/README.md).

## Repo Structure

```txt
.
├── CONCEPT.md
├── backend/
│   └── FastAPI mock-data capability server
└── os/
    └── Fluid OS web app
```

## Run The Mock Backend

Install dependencies once:

```sh
uv sync --project backend
```

```sh
uv run --project backend uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8787
```

To launch the backend and expose every tool prefix through ngrok:

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

This prints public URLs for:

```txt
https://uncombed-wand-unfitted.ngrok-free.dev/contacts/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/calendar/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/tasks/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/tables/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/notes/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/files/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/search/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/maps/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/calculator/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/forms/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/canvas/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/messages/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/shadcn/openapi.json
```

Then open:

```txt
http://localhost:8787/health
```

The main discovery endpoint is:

```txt
http://localhost:8787/capabilities
```

Use the shared dev API key for registry and tool calls:

```txt
X-API-Key: fluid-os-dev-key
```

Each fake tool can also be registered independently by prefix:

```txt
http://localhost:8787/contacts/openapi.json
http://localhost:8787/calendar/openapi.json
http://localhost:8787/tasks/openapi.json
http://localhost:8787/tables/openapi.json
http://localhost:8787/notes/openapi.json
http://localhost:8787/files/openapi.json
http://localhost:8787/search/openapi.json
http://localhost:8787/maps/openapi.json
http://localhost:8787/calculator/openapi.json
http://localhost:8787/forms/openapi.json
http://localhost:8787/canvas/openapi.json
http://localhost:8787/messages/openapi.json
http://localhost:8787/shadcn/openapi.json
```

The generated API docs are:

```txt
http://localhost:8787/docs
```
