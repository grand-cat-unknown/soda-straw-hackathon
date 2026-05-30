# Fluid OS Pitch

Fluid OS is an intent-driven operating surface for the agent era.

Instead of forcing people to jump between fixed apps, Fluid OS lets a user say
what they want to do and then assembles a temporary, interactive workspace for
that exact goal.

```txt
User intent -> governed capabilities -> agent plan -> widgets + bridges -> action
```

The interface is ephemeral. The building blocks are stable. The backend
capabilities are real, scoped, and secure.

## The Problem

Software is still organized around fixed apps.

If you want to plan a dinner, organize a trip, run a product launch, or analyze
customer data, you usually have to decide which app to open first. Then you move
between contacts, calendar, notes, tasks, maps, messages, spreadsheets, files,
dashboards, and internal tools.

The user becomes the integration layer.

That model starts to feel backwards in a world where more systems expose their
capabilities directly through APIs, MCP servers, databases, SaaS tools, and
agent-callable functions.

If the backend is becoming modular, the interface should become modular too.

## The Idea

Fluid OS treats software as something that can form around intent.

The user does not need to ask:

```txt
Which app do I open?
```

They can ask:

```txt
What am I trying to do?
```

Fluid OS then creates the operating surface for that task using:

- stable widgets such as contacts, calendar, tasks, notes, tables, maps,
  messages, files, forms, search, and calculator,
- backend capabilities exposed through Soda Straw, MCPs, APIs, and databases,
- typed contracts that describe each widget's inputs and outputs,
- bridges that connect widgets together into a live workflow graph,
- an agent that can inspect the current workspace and mutate it through
  structured canvas tools.

This is not a chatbot that only answers in text. It is an agent over a live
workspace.

## Demo Walkthrough

A user says:

> Plan a birthday dinner with friends in two weeks.

Fluid OS can turn that intent into a workspace:

1. A contacts widget loads friends from the contacts capability.
2. A calendar widget checks dates and creates the event.
3. A map widget helps compare possible locations.
4. A table widget tracks budget, venues, food, and RSVPs.
5. A tasks widget creates the prep checklist.
6. A messages widget drafts invites for the selected guests.

Then the workspace becomes interactive:

```txt
contacts.selectedContacts -> messages.recipients
contacts.selectedContacts -> table.rows
map.selectedMarker -> marker-detail.marker
table.selectedRows -> tasks.tasks
```

Selecting people can update the invite draft. Selecting a place can update the
detail panel. Rows in a table can become tasks. The agent can add another panel,
change the layout, wire a new bridge, or call a backend capability without
forcing the user to leave the workspace.

The result feels like a custom app, but it was assembled in the moment from
standard OS-level pieces.

## What Makes It Special

### Ephemeral Interfaces, Stable Blocks

Fluid OS does not rely on arbitrary generated UI. Widgets are deterministic,
typed, reusable blocks. The agent decides which blocks to use, how to configure
them, and how to connect them for the user's current task.

That gives Fluid OS both personalization and reliability:

```txt
Custom enough for this exact moment.
Stable enough to trust, extend, and debug.
```

### Agent-Wired Workflows

Most dashboards are static. Fluid OS workspaces are live graphs.

Widgets expose typed outputs and typed inputs. Bridges connect them. Transforms
adapt data shapes when needed. The agent can create those connections on the go
based on the user's intent.

This means the workspace can behave like a living tool rather than a collection
of disconnected panels.

### Real Backend Capabilities

Widgets can bind to real capabilities and refresh from them. A table can load
from `tables.get`, call `tables.add_row`, and refresh itself. A tasks widget can
call `tasks.update`. A map can call place search or directions. Messages can be
drafted through a backend tool.

Fluid OS is not showing a screenshot of an app. It is creating an operational
surface over callable capabilities.

### Modular Safety

The interface can be fluid without being unsafe.

In production, secrets and powerful actions do not need to live in the browser
or in generated UI. They stay behind the server, backend services, Soda Straw,
and MCP access controls.

```txt
Browser UI / ephemeral canvas
        |
Next.js server routes
        |
Soda Straw MCP / scoped capability access
        |
Backend APIs / databases / SaaS tools / secrets
```

The canvas can only do what the granted capabilities allow. Soda Straw can
control which tools are available, which credentials are used, and which actions
the agent is allowed to perform. The generated interface is already inside the
sandbox defined by the capability layer.

That is the key safety story: Fluid OS makes the interface flexible while
keeping permissions, credentials, and blast radius in the proper backend layer.

## Why Soda Straw Matters

Soda Straw is the capability backbone.

It lets Fluid OS connect to APIs, MCP servers, databases, SaaS tools, and
internal services in a governed way. Each connected capability can be exposed as
a tool with scoped access. The Fluid OS agent can then compose those tools into
the workspace the user needs.

This makes the system extensible in both directions:

- add more backend capabilities through Soda Straw, MCPs, APIs, and databases,
- add more frontend widgets and transforms through open source UI components.

The OS layer sits between those worlds and turns raw tools into usable
interfaces.

## Why Now

This is becoming possible because several trends are converging:

- MCPs and tool-calling make backend capabilities discoverable and executable by
  agents.
- API-first products expose more actions directly.
- LLMs can reason over schemas, contracts, tool catalogs, and current state.
- Open-source UI systems make reusable frontend blocks easier to standardize.
- Users increasingly expect software to adapt to their intent instead of making
  them adapt to app boundaries.

Fluid OS is an experiment in what the interface layer should look like when
capabilities are modular and agents can compose them.

## How It Compares

| Category | What it does | Where it falls short | Fluid OS difference |
| --- | --- | --- | --- |
| Chatbot | Answers in text | Does not create a live operating surface | Builds and edits an interactive workspace |
| Dashboard | Shows predefined data | Layout and workflows are fixed ahead of time | Assembles the dashboard for the current intent |
| Automation | Runs predefined workflows | Hidden, rigid, and often hard to inspect | Keeps the workflow visible, editable, and interactive |
| App builder | Lets users design apps | Requires the user to become the builder | The agent creates the app from the user's goal |
| Traditional OS | Launches fixed apps | App boundaries still define the work | Composes task-specific apps from capabilities |

## Use Cases

Fluid OS is as broad as the capabilities connected to it.

Personal use cases:

- plan a dinner or party,
- coordinate meeting friends,
- organize a trip,
- track personal projects,
- manage notes, files, and follow-ups.

Work use cases:

- run a launch checklist,
- investigate customer issues,
- prepare sales follow-ups,
- compare vendors,
- query operational data,
- create lightweight internal tools on demand.

Deep analysis use cases:

- connect to databases or analytics APIs,
- generate tables, filters, charts, notes, and task handoffs,
- let the agent assemble the specific analysis surface needed for the question,
- keep the result interactive instead of trapping it in a static report.

## What The Prototype Shows

The current prototype demonstrates the core loop:

- a chat REPL that sends the current canvas state to the agent,
- a live canvas with widgets, layout, outputs, and bridges,
- widget contracts with typed inputs and outputs,
- backend-backed bindings and direct widget actions,
- bridge validation and transforms,
- Soda Straw-backed capability access,
- a modular mock backend with contacts, calendar, tasks, tables, notes, files,
  search, maps, calculator, forms, canvas, messages, and shadcn.

It proves the architecture: stable capabilities plus stable widgets can produce
fluid, personalized interfaces.

## What Comes Next

The next evolution would make Fluid OS feel even more like a real operating
layer:

- persistent workspaces,
- user and organization-level permissions,
- richer audit logs for agent and widget actions,
- more widgets and visualizations,
- reusable workspace templates,
- collaborative spaces,
- deeper Soda Straw integrations,
- enterprise data connectors,
- stronger approval flows for sensitive actions,
- shareable workspaces and saved workflows.

## The One-Sentence Pitch

Fluid OS is an agent-native operating surface that creates the app you need for
the task in front of you, using stable widgets and governed backend capabilities
instead of forcing you through a maze of fixed applications.
