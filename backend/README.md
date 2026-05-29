# Backend

This is the fake capability server for the hackathon prototype.

It behaves like a small local API/MCP hub: the OS can ask what capabilities exist, then call endpoints for contacts, calendar events, tasks, budgets, shopping, and messages.

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
- `GET /contacts`
- `GET /calendar/events`
- `GET /tasks`
- `GET /shopping/search?q=snacks`
- `POST /budget/estimate`
- `POST /messages/draft`
- `POST /actions/simulate`

All data is mocked and safe to change.
