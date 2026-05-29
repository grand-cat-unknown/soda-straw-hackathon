# Backend Capabilities

The backend is a FastAPI mock capability server. All registry, metadata, and
tool-call endpoints use shared API-key auth:

```txt
X-API-Key: fluid-os-dev-key
```

The registry endpoint is:

```txt
GET /tools
```

The planner/capability endpoint is:

```txt
GET /capabilities
```

Each tool also has:

```txt
GET /{tool}/health
GET /{tool}/openapi.json
```

## Enabled Tools

Enabled modules are listed in `backend/app/tools/__init__.py`.

### contacts

Purpose: fake people/contact lookup.

Endpoints:

- `GET /contacts` - search contacts by name, relationship, city, or tag.
- `GET /contacts/{contact_id}` - fetch one contact by ID.

Capability IDs:

- `contacts.search`
- `contacts.get`

### calendar

Purpose: fake calendar event read/write.

Endpoints:

- `GET /calendar/events` - list upcoming events.
- `POST /calendar/events` - create a mocked event.

Capability IDs:

- `calendar.list`
- `calendar.create`

### tasks

Purpose: fake todo/task planning.

Endpoints:

- `GET /tasks` - list tasks, optionally filtered by `status`.
- `POST /tasks` - create a mocked task.
- `PATCH /tasks/{task_id}` - update title, due date, or status.

Capability IDs:

- `tasks.list`
- `tasks.create`
- `tasks.update`

### shopping

Purpose: fake shopping catalog search.

Endpoints:

- `GET /shopping/search` - search products by name or category.

Capability IDs:

- `shopping.search`

### budget

Purpose: fake budget estimation.

Endpoints:

- `POST /budget/estimate` - estimate cost from guest count, per-guest spend, categories, and currency.

Capability IDs:

- `budget.estimate`

### messages

Purpose: fake message drafting.

Endpoints:

- `POST /messages/draft` - draft an invite or follow-up message.

Capability IDs:

- `messages.draft`

### actions

Purpose: debug/simulation endpoint for action execution.

Endpoints:

- `POST /actions/simulate` - pretend to execute a tool call and return a traceable result.

Capability IDs:

- `actions.simulate`

## Adding A Tool

1. Create `backend/app/tools/<tool>.py`.
2. Define `tool_name`, `router`, Pydantic request/response models, route handlers, and `capabilities`.
3. Add the module to `backend/app/tools/__init__.py`.
4. Start the backend and verify:

```txt
GET /tools
GET /{tool}/openapi.json
```

5. Re-sync Soda Straw:

```sh
SODA_STRAW_API_KEY=your-soda-straw-api-key SODA_STRAW_RESET=1 ./backend/launch-backend-ngrok.sh
```
