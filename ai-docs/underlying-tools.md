# Underlying OS Tools

The OS should expose a small set of deterministic, reusable tools. These tools should not know about high-level intents like "party" or "trip." They should provide stable primitives that an agent can compose into a temporary interface for the user's current goal.

The key product idea:

> The tools are stable. The interface is disposable.

The agent should create the experience on the fly. A birthday party can become an RSVP dashboard, budget board, shopping list, and prep timeline. A trip can become a map, booking tracker, itinerary board, and packing checklist. Underneath, both are built from the same basic tools.

Intent-specific modules should exist at the interface/data-template layer, not the tool layer. For example, "RSVP Tracker" and "Trip Map" can be generated modules, but they should still be backed by generic tools like `tables`, `contacts`, `forms`, `maps`, and `canvas`.

## Design Principles

- Tools should be deterministic and boring.
- Tools should expose CRUD-like operations over common personal data types.
- Tools should return structured data, not bespoke UI.
- Tools should avoid intent-specific names like `plan_party` or `build_itinerary`.
- The agent should decide which tools to call, what data model to create, and what interface to render.
- The user should not need to understand the tool graph. They should experience a simple custom workspace.
- Intent-specific modules should be generated from primitives, not exposed as special-purpose tools.

## Core Tools

| Tool | What It Owns | What It Should Expose |
| --- | --- | --- |
| `calendar` | Time, events, deadlines, reminders | Create/read/update/delete events; create reminders; find availability; detect conflicts; list upcoming deadlines |
| `contacts` | People and groups | Create/read/update people; create groups; store preferences, notes, relationships, dietary needs, availability, emergency contacts |
| `messages` | Human communication | Draft messages; send messages; track sent messages; detect replies; create follow-up reminders |
| `tasks` | Work to be done | Create/read/update tasks; assign owners; set due dates; mark status; express dependencies; group tasks by project or intent |
| `tables` | Structured lists and trackers | Create/read/update tables; add rows and columns; sort/filter/group; support typed columns like money, date, status, person, place |
| `notes` | Flexible structured memory | Create/read/update notes; store briefs, decisions, assumptions, preferences, research summaries, freeform context |
| `files` | Attachments and artifacts | Store files; retrieve files; label files; link files to rows, events, people, tasks, or notes |
| `search` | External discovery | Search web or connected sources; return result cards with title, URL, snippet, source, timestamp |
| `maps` | Places and movement | Search places; store saved places; estimate travel time; cluster places; compare locations by distance or neighborhood |
| `calculator` | Deterministic math and scoring | Calculate budgets, quantities, durations, totals, gaps, percentages, scores, rankings, and tradeoffs |
| `forms` | Lightweight input collection | Create forms; define fields; collect responses; map responses into tables, contacts, or tasks |
| `canvas` | Generated interfaces | Render temporary views over data: dashboard, board, timeline, map, checklist, table, comparison view, calendar view |

## Tool Surface Sketches

These are not final APIs. They show the level of granularity the tools should expose.

### `calendar`

```ts
calendar.createEvent({
  title,
  startsAt,
  endsAt,
  location?,
  attendees?,
  linkedIntentId?,
  linkedTaskIds?
})

calendar.createReminder({
  title,
  remindAt,
  linkedIntentId?,
  linkedEntity?
})

calendar.findConflicts({
  timeRange,
  people?
})
```

### `contacts`

```ts
contacts.createGroup({
  name,
  people,
  linkedIntentId?
})

contacts.updatePerson({
  personId,
  fields: {
    name?,
    email?,
    phone?,
    preferences?,
    constraints?,
    notes?
  }
})
```

### `messages`

```ts
messages.draft({
  recipients,
  channel,
  purpose,
  tone?,
  context
})

messages.send({
  draftId
})

messages.trackReplies({
  messageId,
  responseMapping?
})
```

### `tasks`

```ts
tasks.create({
  title,
  dueAt?,
  owner?,
  status?,
  dependencies?,
  linkedIntentId?,
  linkedEntities?
})

tasks.updateStatus({
  taskId,
  status
})
```

### `tables`

```ts
tables.create({
  name,
  columns,
  linkedIntentId?
})

tables.addRow({
  tableId,
  values
})

tables.query({
  tableId,
  filter?,
  sort?,
  groupBy?
})
```

### `notes`

```ts
notes.create({
  title,
  body,
  type?,
  linkedIntentId?,
  linkedEntities?
})

notes.append({
  noteId,
  body
})
```

### `files`

```ts
files.store({
  file,
  labels?,
  linkedIntentId?,
  linkedEntities?
})

files.link({
  fileId,
  entity
})
```

### `search`

```ts
search.web({
  query,
  filters?,
  location?,
  timeRange?
})
```

### `maps`

```ts
maps.searchPlaces({
  query,
  near?,
  filters?
})

maps.estimateTravelTime({
  origin,
  destination,
  mode,
  departureTime?
})

maps.clusterPlaces({
  places,
  constraints?
})
```

### `calculator`

```ts
calculator.compute({
  expression,
  variables
})

calculator.scoreOptions({
  options,
  criteria,
  weights
})
```

### `forms`

```ts
forms.create({
  title,
  fields,
  destination
})

forms.getResponses({
  formId
})
```

### `canvas`

```ts
canvas.render({
  title,
  layout,
  dataSources,
  actions
})
```

## What the Agent Adds

The agent is responsible for the high-level interpretation:

- Inferring the user's intent.
- Creating the right temporary data model.
- Selecting which primitive tools to use.
- Naming the workspace and views.
- Turning tool outputs into useful interfaces.
- Explaining decisions and tradeoffs in natural language.
- Updating the interface as the user's plan changes.

The tools should not contain this judgment. They should simply expose reliable operations over calendar entries, contacts, messages, tasks, tables, notes, files, search results, maps, calculations, forms, and canvases.
