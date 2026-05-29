# Soda Straw Hackathon

Prototype repo for a Fluid Modular OS: an intent-driven workspace that assembles UI modules and tool calls around what the user wants to do.

## Repo Structure

```txt
.
├── CONCEPT.md
├── backend/
│   └── Mock API/capability server
└── os/
    └── Fluid OS web app
```

## Run The Mock Backend

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
