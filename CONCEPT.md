# Fluid Modular OS

## One-Line Idea

A fluid modular OS is an intent-driven web workspace that assembles its interface, tools, and workflows dynamically around what the user is trying to do.

Instead of opening fixed apps like contacts, calendar, notes, shopping, and email separately, the user starts with an intent:

> "I want to plan a housewarming party next Saturday."

The system then discovers the relevant capabilities, asks only the necessary clarifying questions, and builds a temporary interactive workspace for that goal.

## Why This Matters

Modern software is moving toward APIs, MCP servers, agent tools, and service hubs. These systems increasingly expose actions directly:

- Search contacts
- Create calendar events
- Send messages
- Generate documents
- Manage tasks
- Search products
- Place orders
- Query databases
- Update CRMs

In this world, the backend is becoming modular and tool-like. But the frontend is still mostly trapped inside fixed applications.

The core idea of this project is:

> If capabilities are modular, the interface should be modular too.

The OS should not force the user to decide which app to open. The user should describe what they want, and the system should construct the right operating surface for that intent.

## Core Interaction Model

The system follows this loop:

```txt
Intent -> Tool Discovery -> Clarifying Conversation -> UI Assembly -> Reactive Workflow -> Action Execution
```

### 1. Intent

Every session starts with a user goal.

Examples:

- "Plan a birthday party."
- "Prepare a launch checklist."
- "Organize my trip to Berlin."
- "Help me follow up with everyone I met this week."
- "Set up a project plan for this hackathon."

### 2. Tool Discovery

The system looks at available APIs, MCPs, or mocked tools and decides which ones are relevant.

For a party-planning intent, the relevant capabilities might be:

- Contacts API
- Calendar API
- Notes or task API
- Budget calculator
- Shopping API
- Messaging API

### 3. Clarifying Conversation

Before building the UI, the system asks for missing information.

For example:

- What kind of party is it?
- When is it?
- How many people are you thinking of inviting?
- Is there a budget?
- Do you want help with food, drinks, invites, or all of it?

The conversation should be short and purposeful. Its job is not to chat forever. Its job is to gather enough context to create the workspace.

### 4. UI Assembly

After the initial conversation, the system builds a workspace from modular UI components.

For the party example, the workspace could include:

- Guest selector
- Budget table
- Shopping checklist
- Invite message draft
- Timeline of tasks
- Calendar event preview
- Action panel

This is the "OS" moment: the interface is not a fixed screen. It is generated from the user's intent and the available capabilities.

### 5. Reactive Workflow Graph

The modules in the workspace are connected.

Changes in one module should affect others.

Example:

```txt
Guest Selector -> Budget Calculator -> Shopping List
       |                  |
       v                  v
Invite Draft       Task Timeline
       |
       v
Messaging Action
```

If the user changes the guest count, the budget estimate changes. If the budget changes, the shopping list changes. If the date changes, the invite draft and task timeline update.

This dependency graph is a key part of the concept. The workspace is not just a collection of widgets. It is a living tool graph.

### 6. Action Execution

Once the user is happy with the workspace, the system can perform actions through connected tools.

Examples:

- Create a calendar event
- Draft or send invitations
- Create tasks
- Export a shopping list
- Simulate an Amazon order
- Save the workspace as a reusable workflow

For the hackathon demo, many of these can be simulated while still showing the architecture clearly.

## Hackathon MVP

The hackathon version should be a focused web app, not a full operating system.

The goal is to demonstrate the interaction model convincingly.

### Must Have

- Intent input
- Short clarification flow
- Tool/capability registry
- Dynamic workspace generation
- A small library of reusable UI modules
- Visible dependency graph between modules
- One polished end-to-end demo scenario

### Nice To Have

- Integration with the provided API/MCP hub
- Saving and reloading sessions
- Multiple demo intents
- Real calendar or contacts integration
- LLM-generated workspace plans
- Action logs showing which tools were called

### Avoid For MVP

- Arbitrary code generation
- Too many real API integrations
- A fully general app builder
- Complex authentication
- Trying to support every possible intent

The strongest version for 12 hours is a polished vertical slice.

## Suggested Demo Scenario

The best demo scenario is:

> "I want to plan a housewarming party next Saturday."

The system can then:

1. Ask a few questions about budget, vibe, and guest count.
2. Discover relevant capabilities.
3. Generate a party-planning workspace.
4. Show a guest selector, budget calculator, shopping list, invite draft, and task timeline.
5. Demonstrate reactive updates across modules.
6. Simulate actions like creating tasks, drafting invites, and preparing an order.

This scenario is relatable, visual, and easy to understand quickly.

## Product Framing

This is not just an AI chatbot.

A chatbot answers in text. A fluid modular OS turns intent into an operating surface.

This is not just a dashboard.

A dashboard shows predefined data. A fluid modular OS creates the right dashboard, tools, and actions for the current goal.

This is not just automation.

Automation runs predefined workflows. A fluid modular OS constructs workflows from available capabilities and keeps them editable by the user.

## Pitch

As more services expose their capabilities through APIs and MCPs, software needs a new interface layer.

The old model is:

```txt
User -> App -> Feature -> API
```

The new model can be:

```txt
User Intent -> Capability Graph -> Generated Workspace -> Actions
```

Fluid Modular OS explores that new layer: an intent-native interface that assembles itself from the tools available around the user.

## Working Name Options

- Fluid OS
- Modular OS
- IntentOS
- FlowOS
- Surface
- Loom
- Workbench
- ContextOS

## Guiding Principle

The user should not have to think:

> Which app do I open?

They should be able to say:

> Here is what I want to do.

And the system should create the place where that work can happen.
