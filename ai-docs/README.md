# AI Docs

This folder is the quick context pack for AI agents working on this repo.
Keep it current when backend tools, public URLs, Soda Straw registration, or
core workflows change.

## Current System

This repo is a hackathon prototype for a Fluid Modular OS. The current working
surface is a FastAPI mock capability backend with fake data and real HTTP
contracts.

Key paths:

- `backend/app/main.py` - FastAPI app, registry endpoints, per-tool OpenAPI slicing.
- `backend/app/tools/` - one fake capability module per tool prefix.
- `backend/app/tools/__init__.py` - imports and orders enabled tool modules.
- `backend/launch-backend-ngrok.sh` - starts FastAPI and exposes it through ngrok.
- `backend/scripts/sync_soda_straw_straws.py` - deletes/recreates Soda Straw straws from the live backend registry.
- `os/` - placeholder Fluid OS web app scaffold.

## Runtime Defaults

- Local backend: `http://127.0.0.1:8787`
- Static ngrok URL: `https://uncombed-wand-unfitted.ngrok-free.dev`
- Backend auth header: `X-API-Key`
- Default backend dev API key: `fluid-os-dev-key`
- Soda Straw workspace: `https://srikanthganta.straw.demo.soda.io`
- Soda Straw straw prefix for this project: `fluid-os-`
- Local backend environment file: `backend/.env`

## Run Commands

Install backend dependencies:

```sh
uv sync --project backend
```

Run FastAPI locally:

```sh
uv run --project backend uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8787
```

Run FastAPI plus static ngrok:

```sh
./backend/launch-backend-ngrok.sh
```

Run FastAPI plus static ngrok, then reset Soda Straw straws:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key SODA_STRAW_RESET=1 ./backend/launch-backend-ngrok.sh
```

Run only the Soda Straw sync against an already-running public backend:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key backend/scripts/sync_soda_straw_straws.py
```

## Docs In This Folder

- `backend-capabilities.md` - current exposed backend tools and endpoints.
- `soda-straw-sync.md` - Soda Straw registration/reset workflow.
- `maintenance.md` - checklist for keeping these docs and integrations current.
