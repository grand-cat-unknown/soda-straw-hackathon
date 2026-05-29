# OS

This folder will contain the actual Fluid Modular OS web app.

It will consume the mock backend as if it were an API/MCP hub:

```txt
Intent -> Capability Discovery -> Workspace Plan -> Reactive UI Modules -> Tool Calls
```

## Planned Pieces

- Intent input
- Clarifying conversation
- Capability discovery from `GET /capabilities`
- Workspace planner
- Modular UI component registry
- Reactive dependency graph
- Action log

For now, this folder is intentionally light. The backend gives us a stable fake world to build against first.
