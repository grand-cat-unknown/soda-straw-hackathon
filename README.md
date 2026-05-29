# Soda Straw Hackathon

Prototype repo for a Fluid Modular OS: an intent-driven workspace that assembles UI modules and tool calls around what the user wants to do.

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
./launch-backend-ngrok.sh
```

The public launcher defaults to this static ngrok dev domain:

```txt
https://uncombed-wand-unfitted.ngrok-free.dev
```

Override it with `NGROK_URL` if you ever switch domains.

This prints public URLs for:

```txt
https://uncombed-wand-unfitted.ngrok-free.dev/contacts/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/calendar/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/tasks/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/shopping/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/budget/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/messages/openapi.json
https://uncombed-wand-unfitted.ngrok-free.dev/actions/openapi.json
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
http://localhost:8787/shopping/openapi.json
http://localhost:8787/budget/openapi.json
http://localhost:8787/messages/openapi.json
http://localhost:8787/actions/openapi.json
```

The generated API docs are:

```txt
http://localhost:8787/docs
```
