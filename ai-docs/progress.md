# Fluid OS Progress

Running implementation tracker for the live canvas + agent-aware workspace.

## Current status

The first live-canvas slice is implemented:

- Canonical canvas state/types exist.
- Widget contracts and shared schemas exist.
- Bridge validation exists with conservative schema compatibility.
- Sync transforms exist: `identity`, `pickField`, `sortByKey`.
- A live canvas store exists with widget, bridge, layout, output, and trace-idempotency actions.
- Tool traces now dispatch mutations into the canvas store.
- The workspace renderer reads from live canvas state.
- Widget interactions can call `emitOutput` and propagate across bridges with a cycle guard.
- Chat requests include the current canvas snapshot so the agent has state awareness at request time.
- The agent has local `canvas_*` function tools for incremental canvas edits.
- Client-side canvas tool execution mutates the live store and feeds tool outputs back into the model continuation loop.
- `canvas_preview_bridge` is implemented.
- Adding a bridge now immediately propagates the latest source output when one exists.
- `canvas_list_widgets` is available for compact widget inspection.
- Widget frames now expose edit/remove controls, visible input/output ports, and last-emitted outputs.
- Table, map, canvas summary, marker-detail, and generic result widgets now have clear UI actions that emit node outputs.
- Production build passes with `npm run build`.

## Completed

### 1. Product/spec alignment

- Added the product model to `ai-docs/canvas-and-bridges.md`.
- Clarified that v1 awareness is chat-triggered canvas snapshots, not a background daemon.
- Added `canvas.get_state()` to the tool model.
- Added widget/input/layout mutation tools to the tool model.
- Chose trace replay idempotency via stable trace operation IDs.
- Removed async/geocoding transforms from v1.
- Added conservative bridge compatibility rules.
- Added explicit `emitOutput(nodeId, port, value)`.

### 2. Workspace model

- Added live canvas concepts to `os/lib/workspace/types.ts`.
- Added shared schemas in `os/lib/workspace/schemas.ts`.
- Added widget contracts in `os/lib/workspace/contracts.ts`.
- Converted `registry.ts` into a compatibility shim over contracts.

### 3. Runtime foundations

- Added bridge validation in `os/lib/workspace/bridges.ts`.
- Expanded transforms in `os/lib/workspace/transforms.ts`.
- Added live canvas store in `os/lib/workspace/store.ts`.
- Added propagation guard with revision/visited tracking and a 32-hop limit.

### 4. UI integration

- Updated trace adapters to apply traces into the store.
- Updated `CanvasHost` and `WorkspaceRenderer` to subscribe to canvas state.
- Updated chat submission to send the current canvas snapshot.
- Updated chat route instructions to treat the canvas snapshot as current workspace state.

### 5. Agent-facing canvas tools

- Added server-safe tool schemas in `os/lib/workspace/canvas-tool-defs.ts`.
- Added client-side canvas tool execution in `os/lib/workspace/canvas-tools.ts`.
- Registered local `canvas_*` function tools alongside Soda Straw MCP tools.
- Added a multi-turn chat loop: model requests canvas tool calls, the client executes them locally, then posts function-call outputs back with `previous_response_id`.
- Added trace entries for pending/completed local canvas tool calls.
- Implemented `canvas_preview_bridge`.
- Mutation tool outputs now include affected nodes/bridges/layout plus the updated canvas snapshot and revision.
- `canvas_add_bridge` now pushes the latest source output into the target input immediately when the source already has output.
- Added `canvas_list_widgets` for compact widget inspection.

### 6. Editable widget surfaces

- Added generic JSON input editing to every widget frame.
- Added widget removal from the live canvas.
- Added visible input/output port chips to each widget.
- Added an output inspector showing last emitted port values.
- Added table row selection that emits `selectedRows`.
- Added map marker action buttons that emit `selectedMarker`, including when Mapbox is unavailable.
- Added canvas action buttons that emit `actionRequested`.
- Added marker-detail and tool-result buttons that emit `marker` and `value`.

## Still left

### 1. Add stronger validation

Current schema handling is intentionally lightweight.

Still needed:

- Runtime value validation when flowing through bridges.
- Better object/array compatibility diagnostics.
- Optional replacement with `ajv` if we decide to add the dependency.

### 2. Improve trace mutation semantics

Trace replay is idempotent, but still basic.

Still needed:

- Better handling for updates to an existing canvas from newer traces.
- Rules for when a fresh `canvas.render` should replace vs. merge with current canvas.
- A way to reset only tool-derived canvas state while preserving user-authored state, if needed.

### 3. Layout rendering

The store tracks layout, but the renderer still displays widgets in a simple vertical stack.

Still needed:

- Render widgets according to `layout`.
- Decide whether layout units map to CSS grid columns, absolute canvas coordinates, or a hybrid.
- Add visual bridge indicators later, if useful.

### 4. Agent behavior polish

The agent receives canvas state and can call local canvas tools, but prompt behavior still needs real-world tuning.

Still needed:

- Teach the agent to prefer modifying the current canvas.
- Teach the agent when to add a widget vs. update an input vs. create a bridge.
- Add examples for common flows like "make the map follow the table" or "add a detail panel".
- Verify the model reliably chooses `canvas_*` for incremental edits and `canvas.render` for fresh starts.
- Teach the model that widget UI actions emit outputs that can be bridged.

### 5. Tests

Build passes, but targeted tests are still needed.

Suggested tests:

- Transform tests for `identity`, `pickField`, `sortByKey`.
- Bridge validation tests for compatible/incompatible ports.
- Store tests for trace idempotency.
- Propagation tests for `A -> B`, chained bridges, and cycle cutoff.
- Canvas tool tests for mutation outputs and immediate propagation after `canvas_add_bridge`.
- Widget interaction tests for edit/save/remove, table selection, and output emission.

## Suggested next milestone

Make the live canvas feel like a real operating surface:

1. Render widgets according to stored `layout`.
2. Add lightweight visual bridge indicators.
3. Add focused tests for transforms, bridge validation, propagation, and canvas tools.
4. Demo: user asks, "Add a selected marker detail panel and wire the map to it," and the new panel appears populated if a marker is already selected.
