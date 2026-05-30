# Fluid OS

Fluid OS is an experiment in where operating systems go next: away from rigid,
predefined apps and toward intent-shaped workspaces that form around what the
user is trying to do.

Most software today is organized as fixed apps. Each app ships with a fixed set
of screens, workflows, and assumptions about what the user might want. As agents
become more capable, that model starts to feel backwards. The durable layer
should be the capabilities: databases, APIs, MCP servers, permissions, tools,
automations, and execution environments. The interface can then be assembled in
the moment.

Fluid OS explores that model. It uses Soda Straw as the capability backbone: the
place where MCPs, APIs, databases, and external tools are connected, scoped, and
made available. On top of that, Fluid OS provides a live operating surface where
an agent can compose the right UI for the current task.

```txt
User intent -> Soda Straw capabilities -> Agent workspace plan -> Widgets + bridges -> Actions
```

## The Core Idea

Fluid OS is not a single app with a fixed feature set. It is an agent-native
operating layer made from three stable parts:

- **Stateful backend capabilities** exposed through Soda Straw and MCP.
- **Deterministic widgets** that Fluid OS knows how to render and operate.
- **Ephemeral workspaces** assembled by an agent for the specific user, task, and
  moment.

The backend data remains deterministic and stateful. Contacts, calendar events,
tasks, notes, tables, files, forms, maps, messages, and other capability results
come from real tool calls. The UI, however, is fluid. The agent chooses which
widgets to create, how to configure them, and which bridges should connect their
inputs and outputs.

Instead of opening a rigid contacts app, calendar app, notes app, and task app,
the user can describe an intent. Fluid OS can then build a temporary workspace
using the exact pieces needed for that intent.

## Widgets

Widgets are deterministic building blocks that live on the OS side. They are not
freeform generated UI; they are modular, typed templates with declared inputs,
outputs, render behavior, and optional tool bindings.

Current widget examples include:

- `contacts` for people and groups from the contacts capability.
- `calendar` for events, reminders, and availability.
- `tasks` for task lists and task updates.
- `notes` for persistent note records.
- `table` for structured rows and trackers.
- `map` and `marker-detail` for places, routes, and selected locations.
- `messages` for drafts, sends, and reply tracking.
- `files`, `forms`, `search`, and `calculator` for supporting workflows.

Each widget is stable, reusable, and understandable by the agent. What changes
is how the widget is used. A contacts widget might feed a guest list, a follow-up
pipeline, a meeting planner, or a map. The same building block can participate
in many different workspaces.

## Soda Straw As The Backbone

Soda Straw provides the backend capability layer for Fluid OS. In this prototype,
capabilities are exposed as Soda Straw MCP tools with names like:

```txt
fluid-os-contacts_contacts_search
fluid-os-calendar_calendar_create
fluid-os-tasks_tasks_update
fluid-os-tables_tables_create
fluid-os-canvas_canvas_render
```

Fluid OS widgets can bind to those capabilities. For example:

- A contacts widget can bind to `contacts.search` and render live contact data.
- A table widget can bind to `tables.get` and refresh after `tables.add_row`.
- A calendar widget can create an event and then refresh its event list.
- A map widget can call place search or directions and render the result.

That separation is the point. Soda Straw holds the real capabilities. Fluid OS
turns those capabilities into an operating surface the user can actually work
with.

## Bridges

Widgets expose typed inputs and outputs. Bridges connect those ports so the
workspace behaves like a living tool graph instead of a static dashboard.

For example:

```txt
contacts.selectedContacts -> calendar.selectedContacts
calendar.availableContacts -> map.markers     (via recordsToMarkers)
map.selectedMarker -> marker-detail.marker
table.selectedRows -> tasks.tasks
```

The agent creates these connections on the fly when the user's intent implies
that one widget should drive another. The widgets stay deterministic; the
connections between them are fluid.

This creates a useful split:

- **Data and actions** are stateful and grounded in the backend.
- **Widgets** are reliable OS-level building blocks.
- **The workspace** is ephemeral and generated for the current use case.

## Agent Workflow

For a broad intent, the agent first asks only the clarifying questions that would
materially change the workspace. Once it has enough information, it announces a
plan, adds widgets to the live canvas, binds them to Soda Straw capabilities,
and wires bridges between compatible ports.

The current implementation includes canvas tools for:

- Reading the live canvas state.
- Listing available widgets and transforms.
- Adding, removing, and updating widgets.
- Setting widget layout on a 6-column tile grid.
- Creating and previewing bridges.
- Applying transforms between compatible data shapes.

The result is a prototype of an OS where software does not have to exist ahead
of time as a fixed app. It can form itself around the user's goal, using stable
capabilities and stable UI primitives.

## Running The Web App

Install dependencies:

```sh
npm install
```

Run the development server from this directory:

```sh
npm run dev
```

Then open:

```txt
http://localhost:3000
```

The app expects the backend capability server to be available. See the root
`README.md` for backend and Soda Straw setup.
