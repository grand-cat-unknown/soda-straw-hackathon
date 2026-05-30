"use client";

import { useSyncExternalStore } from "react";

import { validateBridge } from "@/lib/workspace/bridges";
import { widgetContracts } from "@/lib/workspace/contracts";
import { applyTransform, listTransforms } from "@/lib/workspace/transforms";
import type {
  Bridge,
  CanvasLayout,
  CanvasMutationSource,
  CanvasState,
  EdgeId,
  NodeId,
  Port,
  TransformRef,
  WidgetInput,
  WidgetNode,
  WorkspaceGraph,
} from "@/lib/workspace/types";

const DEFAULT_LAYOUT: CanvasLayout = { x: 0, y: 0, w: 12, h: 4 };
const MAX_PROPAGATION_DEPTH = 32;

type Listener = () => void;

type AddWidgetInput = {
  id?: string;
  type: string;
  title?: string;
  input?: WidgetInput;
  layout?: CanvasLayout;
  source?: CanvasMutationSource;
};

type AddBridgeInput = {
  id?: string;
  from: { nodeId: string; port: string };
  to: { nodeId: string; port: string };
  transform?: TransformRef | string | null;
  direction?: "forward" | "bidirectional";
  createdBy?: CanvasMutationSource;
};

type TraceMutation = {
  operationId: string;
  apply: () => void;
};

function emptyState(): CanvasState {
  return {
    nodes: {},
    edges: {},
    outputs: {},
    layout: {},
    appliedTraceIds: {},
    meta: { revision: 0, lastTouchedBy: "tool" },
  };
}

let state: CanvasState = emptyState();
const listeners = new Set<Listener>();

function cloneState(current: CanvasState = state): CanvasState {
  return {
    nodes: { ...current.nodes },
    edges: { ...current.edges },
    outputs: Object.fromEntries(
      Object.entries(current.outputs).map(([nodeId, outputs]) => [
        nodeId,
        { ...outputs },
      ]),
    ),
    layout: { ...current.layout },
    appliedTraceIds: { ...current.appliedTraceIds },
    meta: { ...current.meta },
  };
}

function publish(next: CanvasState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function touch(next: CanvasState, source: CanvasMutationSource): void {
  next.meta = {
    revision: next.meta.revision + 1,
    lastTouchedBy: source,
  };
}

function normalizeTransform(
  transform: TransformRef | string | null | undefined,
): TransformRef | undefined {
  if (!transform) return undefined;
  if (typeof transform === "string") return { id: transform };
  return transform;
}

function defaultTitle(type: string): string {
  return widgetContracts[type]?.title ?? type;
}

function upsertNode(next: CanvasState, node: WidgetNode, layout?: CanvasLayout): void {
  next.nodes[node.id] = node;
  next.layout[node.id] = layout ?? next.layout[node.id] ?? DEFAULT_LAYOUT;
}

function propagateFrom(
  next: CanvasState,
  nodeId: NodeId,
  port: Port,
  value: unknown,
  revision: number,
  depth: number,
  visited: Set<string>,
): void {
  if (depth > MAX_PROPAGATION_DEPTH) {
    console.warn("Canvas bridge propagation exceeded depth limit.");
    next.meta.lastTouchedBy = "tool";
    return;
  }

  const outgoing = Object.values(next.edges).filter(
    (edge) => edge.from.nodeId === nodeId && edge.from.port === port,
  );

  for (const edge of outgoing) {
    const edgeKey = `${edge.id}:${revision}`;
    const targetKey = `${edge.to.nodeId}:${edge.to.port}:${revision}`;
    if (visited.has(edgeKey) || visited.has(targetKey)) continue;
    visited.add(edgeKey);
    visited.add(targetKey);

    const target = next.nodes[edge.to.nodeId];
    if (!target) continue;

    const transformed = applyTransform(edge.transform, value);
    next.nodes[edge.to.nodeId] = {
      ...target,
      input: {
        ...target.input,
        [edge.to.port]: transformed,
      },
    };

    propagateFrom(
      next,
      edge.to.nodeId,
      edge.to.port,
      transformed,
      revision,
      depth + 1,
      visited,
    );
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CanvasState {
  return state;
}

export const canvasStore = {
  getState: getSnapshot,
  subscribe,
  resetCanvas() {
    publish(emptyState());
  },
  addWidget({
    id,
    type,
    title,
    input = {},
    layout,
    source = "agent",
  }: AddWidgetInput): NodeId {
    const nodeId = id ?? `${type}:${crypto.randomUUID()}`;
    const next = cloneState();
    upsertNode(
      next,
      {
        id: nodeId,
        type,
        title: title ?? defaultTitle(type),
        input,
      },
      layout,
    );
    touch(next, source);
    publish(next);
    return nodeId;
  },
  updateWidgetInput(
    nodeId: NodeId,
    input: WidgetInput,
    source: CanvasMutationSource = "agent",
  ) {
    const existing = state.nodes[nodeId];
    if (!existing) return;
    const next = cloneState();
    next.nodes[nodeId] = {
      ...existing,
      input: { ...existing.input, ...input },
    };
    touch(next, source);
    publish(next);
  },
  removeWidget(nodeId: NodeId, source: CanvasMutationSource = "agent") {
    if (!state.nodes[nodeId]) return;
    const next = cloneState();
    delete next.nodes[nodeId];
    delete next.outputs[nodeId];
    delete next.layout[nodeId];
    next.edges = Object.fromEntries(
      Object.entries(next.edges).filter(
        ([, edge]) => edge.from.nodeId !== nodeId && edge.to.nodeId !== nodeId,
      ),
    );
    touch(next, source);
    publish(next);
  },
  setLayout(
    nodeId: NodeId,
    layout: CanvasLayout,
    source: CanvasMutationSource = "agent",
  ) {
    if (!state.nodes[nodeId]) return;
    const next = cloneState();
    next.layout[nodeId] = layout;
    touch(next, source);
    publish(next);
  },
  addBridge(
    input: AddBridgeInput,
  ):
    | { ok: true; bridgeId: EdgeId; propagated: boolean }
    | { ok: false; reason: string } {
    const bridge: Bridge = {
      id: input.id ?? `bridge:${crypto.randomUUID()}`,
      from: input.from,
      to: input.to,
      transform: normalizeTransform(input.transform),
      direction: input.direction ?? "forward",
      createdBy: input.createdBy ?? "agent",
    };
    const validation = validateBridge(state, bridge);
    if (!validation.ok) return validation;

    const next = cloneState();
    next.edges[bridge.id] = bridge;
    touch(next, bridge.createdBy);

    const sourceOutputs = next.outputs[bridge.from.nodeId];
    const sourceHadOutput =
      Boolean(sourceOutputs) && bridge.from.port in sourceOutputs;
    if (sourceHadOutput) {
      const target = next.nodes[bridge.to.nodeId];
      const value = sourceOutputs[bridge.from.port];
      const transformed = applyTransform(bridge.transform, value);
      next.nodes[bridge.to.nodeId] = {
        ...target,
        input: {
          ...target.input,
          [bridge.to.port]: transformed,
        },
      };
      propagateFrom(
        next,
        bridge.to.nodeId,
        bridge.to.port,
        transformed,
        next.meta.revision,
        1,
        new Set<string>([
          `${bridge.id}:${next.meta.revision}`,
          `${bridge.to.nodeId}:${bridge.to.port}:${next.meta.revision}`,
        ]),
      );
    }

    publish(next);
    return { ok: true, bridgeId: bridge.id, propagated: sourceHadOutput };
  },
  removeBridge(edgeId: EdgeId, source: CanvasMutationSource = "agent") {
    if (!state.edges[edgeId]) return;
    const next = cloneState();
    delete next.edges[edgeId];
    touch(next, source);
    publish(next);
  },
  emitOutput(
    nodeId: NodeId,
    port: Port,
    value: unknown,
    source: CanvasMutationSource = "user",
  ) {
    if (!state.nodes[nodeId]) return;
    const next = cloneState();
    next.outputs[nodeId] = {
      ...(next.outputs[nodeId] ?? {}),
      [port]: value,
    };
    touch(next, source);
    propagateFrom(
      next,
      nodeId,
      port,
      value,
      next.meta.revision,
      0,
      new Set<string>(),
    );
    publish(next);
  },
  applyTraceMutation({ operationId, apply }: TraceMutation) {
    if (state.appliedTraceIds[operationId]) return;
    apply();
    const next = cloneState();
    next.appliedTraceIds[operationId] = true;
    publish(next);
  },
};

export function useCanvasState(): CanvasState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function canvasStateToGraph(current: CanvasState): WorkspaceGraph {
  return {
    nodes: Object.values(current.nodes),
    edges: Object.values(current.edges).map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      transform: edge.transform,
    })),
  };
}

export function getCanvasStateForAgent() {
  const current = canvasStore.getState();
  return {
    nodes: current.nodes,
    edges: current.edges,
    outputs: current.outputs,
    layout: current.layout,
    contracts: widgetContracts,
    transforms: listTransforms().map(({ apply: _apply, ...transform }) => transform),
    meta: current.meta,
  };
}
