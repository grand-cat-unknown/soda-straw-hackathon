# Canvas & Bridges

Design doc for the OS workspace state model: a **live canvas** as the single source of truth, widgets with **standardized I/O contracts**, and agent-wired **bridges** (with optional transforms) between widgets.

This doc reflects the design *before* full implementation — it's the spec that Phases 1–5 (below) deliver against. Keep this file in sync with the code as it lands.

---

## Goals

1. **The canvas is the live state.** Not a derivation of tool traces. It survives between trace replays and persists user interactions.
2. **Every widget declares its inputs and outputs** in a standardized, machine-readable contract co-located with the widget component.
3. **Bridges connect widgets.** They are typed, unidirectional (for now), can carry optional transforms, and are created by the LLM/agent when the user's intent implies a connection.
4. **Loops cannot hang the UI.** Even today's unidirectional bridges can chain into cycles; the runtime has a propagation guard so cascades always converge.

Non-goals for v1:
- Bidirectional bridges at runtime. The type system accepts `direction: "bidirectional"` but `add_bridge` rejects them with a clear error. Cycle guard is built now so flipping this on later is a single-line change.
- User-drawn bridges via UI gesture. Agent-created only in v1.
- Persistence across sessions (canvas state is in-memory).

---

## Architecture

### 1. The canvas IS the state

A single Zustand store (`os/lib/workspace/store.ts`) holds the entire canvas:

```ts
type CanvasState = {
  nodes:   Record<NodeId, WidgetNode>;              // widget instances + last-known input
  edges:   Record<EdgeId, Bridge>;                  // bridges (typed connections)
  outputs: Record<NodeId, Record<Port, unknown>>;   // last-emitted output value per port
  layout:  Record<NodeId, { x: number; y: number; w: number; h: number }>;
  meta:    { revision: number; lastTouchedBy: "agent" | "user" | "tool" };
};
```

Shifts from the previous model:

- `buildWorkspace(traces)` (currently in `os/lib/workspace/index.ts` and called from `os/app/page.tsx:194` every render) **stops being the source of truth**. Tool traces *dispatch mutations* into the store — `addWidget`, `setInput`, `addBridge`, `setLayout` — and the store survives across replays.
- Widget user interactions (e.g. clicking a marker) write to `outputs[nodeId][port]`. The runtime cascades downstream, just as today's `runtime.ts:22-39` does — but now persistently, against the store.
- `meta.revision` increments on every mutation. The cycle guard uses it (see §4).

### 2. Standardized widget I/O contract

Each widget file co-locates its contract:

```ts
// os/components/widgets/MapWidget.tsx
export const MapWidgetContract: WidgetContract = {
  type: "map",
  title: "Map",
  description: "Renders places and routes, publishes selected markers.",
  inputs: {
    markers: { schema: PlaceArraySchema, description: "Pins to drop on the map." },
    route:   { schema: RouteSchema,      description: "Optional path through the markers.", optional: true },
  },
  outputs: {
    selectedMarker: { schema: PlaceSchema, description: "Marker the user last clicked." },
    visibleOrder:   { schema: PlaceArraySchema, description: "Markers in current draw order." },
  },
};
```

Where `WidgetContract` (new type in `os/lib/workspace/types.ts`) replaces today's `WidgetDefinition`:

```ts
type PortSchema = JSONSchema7;          // JSON Schema, validated with ajv

type WidgetPortContract = {
  schema: PortSchema;
  description: string;                  // agent reads this to judge semantic fit
  optional?: boolean;                   // inputs only
};

type WidgetContract = {
  type: WidgetType;
  title: string;
  description: string;
  inputs:  Record<string, WidgetPortContract>;
  outputs: Record<string, WidgetPortContract>;
};
```

A central `os/lib/workspace/contracts.ts` imports every widget module and aggregates their contracts. This replaces the hardcoded `registry.ts`.

**Why JSON Schema?** LLMs already read JSON Schema natively. The agent prompts can include port schemas verbatim — no translation layer. `ajv` provides the runtime validator for values flowing across bridges.

### 3. Bridges

```ts
type Bridge = {
  id: string;
  from: { nodeId: string; port: string };
  to:   { nodeId: string; port: string };
  transform?: TransformRef;             // {id, params?}
  direction: "forward" | "bidirectional"; // structurally; runtime honors only "forward" in v1
  createdBy: "agent" | "user" | "tool";
};

type TransformRef = { id: string; params?: Record<string, unknown> };
```

**Compatibility check** (in `os/lib/workspace/bridges.ts`):
- If no transform: structurally compare `from.port.schema` and `to.port.schema`. Compatible if values matching `from` schema would validate against `to` schema. ajv handles the runtime sanity-check on actual flowing values.
- If transform: chain through `transform.inputSchema` and `transform.outputSchema`.

**Agent tools** (Phase 5):
- `canvas.list_widgets()` → `[{id, type, contract}]`
- `canvas.list_bridges()` → `Bridge[]`
- `canvas.add_bridge({from, to, transform?})` → returns `{bridgeId}` or rejection reason
- `canvas.remove_bridge(id)`
- `canvas.list_transforms()` → catalog the agent picks from
- `canvas.preview_bridge({from, to, transform?})` → dry run; returns what `to` input *would* become

When the user says *"make the map follow my list order"*, the agent:
1. Calls `canvas.list_widgets` → finds list + map.
2. Calls `canvas.list_transforms` → finds a `geocodeIfNeeded` transform.
3. Calls `canvas.preview_bridge` to confirm the shape.
4. Calls `canvas.add_bridge({ from: {list, "items"}, to: {map, "markers"}, transform: {id: "geocodeIfNeeded"} })`.

### 4. Cycle / loop safety

Three layers, all built in v1 (even though only forward bridges exist):

**(a) Structural** — `add_bridge` rejects `direction: "bidirectional"` until Phase 6.

**(b) Propagation guard** (in `os/lib/workspace/runtime.ts`) — every cascade carries a `revision` token from `meta.revision`. A node won't re-process the same `(port, revision)` it just emitted. This is what makes future bidirectional safe: when the map re-emits because *its own input* changed (from a list update), the re-emit carries the same revision → no rebound to the list.

**(c) Convergence limit** — cascade depth capped at **32 hops per user event**. If exceeded: stop, log a `console.warn`, surface via `meta.lastTouchedBy = "tool"` + a UI indicator. Prevents pathological transform chains from freezing the UI.

Today's `runtime.ts:22-39` has *no guard at all* — even unidirectional `A→B→C→A` would loop. So (b) and (c) are worth doing now, regardless of bidirectional plans.

### 5. Transforms

`os/lib/workspace/transforms.ts` grows from "registry with `identity`" to:

```ts
type Transform = {
  id: string;
  description: string;
  inputSchema:  PortSchema;
  outputSchema: PortSchema;
  apply: (value: unknown, params?: Record<string, unknown>) => unknown | Promise<unknown>;
};

registerTransform(t: Transform): void;
listTransforms(): Transform[];
applyTransform(ref: TransformRef, value: unknown): Promise<unknown>;
```

Bundled v1 transforms:
- `identity` — passthrough.
- `pickField` — `params: {field: string}`; pulls one key out of objects.
- `sortByKey` — `params: {key: string, direction?: "asc"|"desc"}`.
- `geocodeStub` — async; mock that turns `{name, address}` into `{name, address, lat, lng}`. Real geocoding can land later via a tool channel.

**Async UX** (still open, revisit at Phase 4): while a transform is in-flight, the `to` widget keeps its last input value; the bridge surfaces a small in-flight indicator. No loading spinner inside the widget itself.

---

## File map

**Modified:**
- `os/lib/workspace/types.ts` — add `WidgetContract`, `WidgetPortContract`, `Bridge`, `TransformRef`. Keep current types for back-compat during migration.
- `os/lib/workspace/runtime.ts` — add cycle guard (revision + depth).
- `os/lib/workspace/transforms.ts` — expand per §5.
- `os/lib/workspace/trace-adapters.ts` — emit *mutations against the store* instead of building a fresh graph each call.
- `os/lib/workspace/registry.ts` — deprecate; re-export from `contracts.ts` for back-compat.
- `os/components/widgets/*.tsx` — each exports its `Contract`.
- `os/components/widgets/WorkspaceRenderer.tsx` — subscribes to store.
- `os/app/page.tsx` — drop per-render `buildWorkspace`; dispatch into store.

**New:**
- `os/lib/workspace/store.ts` — Zustand SSoT.
- `os/lib/workspace/contracts.ts` — central contract registry.
- `os/lib/workspace/bridges.ts` — bridge CRUD + compat check.
- `os/lib/workspace/schemas.ts` — shared JSON Schemas (Place, Route, TableRow, …).
- `ai-docs/canvas-and-bridges.md` — this doc.

---

## Build phases

Each phase ships independently and leaves the OS in a working state.

**Phase 1 — Canvas as SSoT (no visible behavior change).** Add Zustand store; refactor `page.tsx` to dispatch trace events; `WorkspaceRenderer` subscribes to store. Validation: existing scenarios render identically; user-clicked state survives a new trace.

**Phase 2 — Widget contracts.** Add `WidgetContract` type + per-widget exports + `contracts.ts` aggregator. `registry.ts` becomes a thin shim. Validation: `tsc` clean; runtime behavior unchanged.

**Phase 3 — Bridge API + cycle guard.** `bridges.ts` with `addBridge`/`removeBridge`/compat-check. Cycle guard in `runtime.ts`. Existing tool-emitted bridges flow through the new API. Validation: existing list↔map scenarios update; a hand-crafted `A→B→C→A` chain stops cleanly.

**Phase 4 — Transform interface.** Expand `transforms.ts`; ship `identity`, `pickField`, `sortByKey`, `geocodeStub`. Validation: unit tests per transform against its schemas.

**Phase 5 — Agent tools.** Expose `canvas.list_widgets`, `canvas.list_bridges`, `canvas.add_bridge`, `canvas.remove_bridge`, `canvas.list_transforms`, `canvas.preview_bridge` via the existing tool dispatch. Validation end-to-end: agent receives "wire the list to the map" and emits an `add_bridge` call visible in the trace panel.

**Phase 6 — (later) Bidirectional.** Flip the `add_bridge` rejection of `direction: "bidirectional"`. Cycle guard already handles it.

---

## Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | JSON Schema + ajv | Agent reads schemas verbatim; no translation layer. |
| 2 | Zustand for the store | Lightweight, no Provider, plays well with React 19. |
| 3 | Bridges unidirectional in v1 | Matches user scoping; structure ready for bidirectional. |
| 4 | Cycle guard built now | Even forward bridges can chain into cycles. |
| 5 | Doc lives in `ai-docs/` | Agent already reads from here; engineers can find it. |

## Open

- Async transform in-flight UX (loading indicator on bridge vs. on widget). Decide when first async transform ships.
- Whether transforms can be registered at runtime from a tool result (deferred to post-v1).
