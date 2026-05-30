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

### tables

Purpose: structured trackers and lists.

Endpoints:

- `GET /tables` - list tables.
- `POST /tables` - create a typed table.
- `GET /tables/{table_id}` - fetch a table and rows.
- `POST /tables/{table_id}/rows` - append a row.
- `GET /tables/{table_id}/rows` - filter, sort, or group rows.

Capability IDs:

- `tables.list`
- `tables.create`
- `tables.get`
- `tables.add_row`
- `tables.query`

### maps

Purpose: place search, geocoding, directions, and travel-time estimates.

Endpoints:

- `POST /maps/geocode` - resolve a place or address.
- `POST /maps/places/search` - search places with optional proximity.
- `POST /maps/directions` - return a route geometry.
- `POST /maps/travel-time` - estimate distance and duration.

Capability IDs:

- `maps.geocode`
- `maps.search_places`
- `maps.directions`
- `maps.estimate_travel_time`

### calculator

Purpose: deterministic math and option scoring.

Endpoints:

- `POST /calculator/compute` - evaluate a numeric expression.
- `POST /calculator/score` - score options from weighted criteria.

Capability IDs:

- `calculator.compute`
- `calculator.score_options`

### messages

Purpose: fake message drafting.

Endpoints:

- `POST /messages/draft` - draft an invite or follow-up message.

Capability IDs:

- `messages.draft`

### canvas

Purpose: declare a generated workspace layout over tool-created data.

Endpoints:

- `POST /canvas/render` - create a temporary canvas spec.
- `GET /canvas` - list canvases.
- `GET /canvas/{canvas_id}` - fetch a canvas spec.
- `DELETE /canvas/{canvas_id}` - discard a canvas.

Capability IDs:

- `canvas.render`
- `canvas.list`
- `canvas.get`
- `canvas.delete`

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
