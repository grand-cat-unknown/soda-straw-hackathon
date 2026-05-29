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
npm run setup:backend
```

This uses UV under the hood:

```sh
uv sync --project backend
```

```sh
npm run backend
```

Then open:

```txt
http://localhost:8787/health
```

The main discovery endpoint is:

```txt
http://localhost:8787/capabilities
```

The generated API docs are:

```txt
http://localhost:8787/docs
```
