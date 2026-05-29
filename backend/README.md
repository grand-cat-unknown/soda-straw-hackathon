# Backend

This is the local capability server for the hackathon prototype.

It behaves like a small local API/MCP hub: the OS can ask what capabilities exist, then call endpoints for contacts, calendar events, tasks, budgets, shopping, and messages.

The data is fake, but the API should behave like a real service:

- Stable routes
- Correct HTTP methods
- JSON request bodies for writes/actions
- Valid JSON error responses
- Basic request validation
- Capability metadata with input/output schemas
- An OpenAPI-style spec at `GET /openapi.json`

Each fake API is a separate module in `backend/tools`, so new capabilities can be added without editing the main server router.

## Run

From the repo root:

```sh
npm run backend
```

Or from this folder:

```sh
npm run dev
```

The server runs on:

```txt
http://localhost:8787
```

## Useful Endpoints

- `GET /health`
- `GET /capabilities`
- `GET /openapi.json`
- `GET /contacts`
- `GET /calendar/events`
- `GET /tasks`
- `GET /shopping/search?q=snacks`
- `POST /budget/estimate`
- `POST /messages/draft`
- `POST /actions/simulate`

All data is mocked and safe to change.

## Add A New Fake Tool

See `backend/tools/README.md`.
