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

## Still left

### 1. Expose real canvas mutation tools to the agent

The local store has the actions, but the agent does not yet have first-class callable tools for:

- `canvas.get_state`
- `canvas.add_widget`
- `canvas.update_widget_input`
- `canvas.remove_widget`
- `canvas.set_layout`
- `canvas.add_bridge`
- `canvas.remove_bridge`
- `canvas.preview_bridge`
- `canvas.list_transforms`

Next decision: expose these as local app-side operations, backend endpoints, or Soda Straw tools.

### 2. Implement bridge preview

`preview_bridge` is in the spec but not implemented yet.

It should:

- Validate source/target ports.
- Apply the selected transform to the latest source output.
- Return the target input shape without mutating state.
- Return a clear rejection reason when incompatible.

### 3. Add stronger validation

Current schema handling is intentionally lightweight.

Still needed:

- Runtime value validation when flowing through bridges.
- Better object/array compatibility diagnostics.
- Optional replacement with `ajv` if we decide to add the dependency.

### 4. Improve trace mutation semantics

Trace replay is idempotent, but still basic.

Still needed:

- Better handling for updates to an existing canvas from newer traces.
- Rules for when a fresh `canvas.render` should replace vs. merge with current canvas.
- A way to reset only tool-derived canvas state while preserving user-authored state, if needed.

### 5. Layout rendering

The store tracks layout, but the renderer still displays widgets in a simple vertical stack.

Still needed:

- Render widgets according to `layout`.
- Decide whether layout units map to CSS grid columns, absolute canvas coordinates, or a hybrid.
- Add visual bridge indicators later, if useful.

### 6. Agent behavior polish

The agent receives canvas state, but the prompt/tool surface still needs refinement once mutation tools exist.

Still needed:

- Teach the agent to prefer modifying the current canvas.
- Teach the agent when to add a widget vs. update an input vs. create a bridge.
- Add examples for common flows like "make the map follow the table" or "add a detail panel".

### 7. Tests

Build passes, but targeted tests are still needed.

Suggested tests:

- Transform tests for `identity`, `pickField`, `sortByKey`.
- Bridge validation tests for compatible/incompatible ports.
- Store tests for trace idempotency.
- Propagation tests for `A -> B`, chained bridges, and cycle cutoff.

## Suggested next milestone

Implement the agent-facing canvas tool layer:

1. Add local callable canvas operations around the store.
2. Implement `get_state`, widget mutations, bridge mutations, and `preview_bridge`.
3. Update the chat flow so agent tool calls can mutate the live store without going through `canvas.render`.
4. Demo: user asks, "Add a selected marker detail panel and wire the map to it."
