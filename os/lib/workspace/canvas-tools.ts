"use client";

import { validateBridge } from "@/lib/workspace/bridges";
import { widgetContracts, getWidgetContract } from "@/lib/workspace/contracts";
import { canvasStore, getCanvasStateForAgent } from "@/lib/workspace/store";
import {
  applyTransform,
  getTransform,
  listTransforms,
} from "@/lib/workspace/transforms";
import type {
  Bridge,
  CanvasLayout,
  TransformRef,
  WidgetInput,
} from "@/lib/workspace/types";

export { canvasToolDefs, canvasToolNames } from "@/lib/workspace/canvas-tool-defs";
export type {
  CanvasToolDef,
  CanvasToolName,
} from "@/lib/workspace/canvas-tool-defs";

function normalizeTransform(transform: unknown): TransformRef | undefined {
  if (!transform) return undefined;
  if (typeof transform === "string") return { id: transform };
  if (typeof transform === "object") {
    const obj = transform as { id?: unknown; params?: unknown };
    if (typeof obj.id === "string") {
      return {
        id: obj.id,
        params:
          obj.params && typeof obj.params === "object"
            ? (obj.params as Record<string, unknown>)
            : undefined,
      };
    }
  }
  return undefined;
}

function readNodeRef(
  ref: unknown,
): { nodeId: string; port: string } | { error: string } {
  if (!ref || typeof ref !== "object") {
    return { error: "Expected { node_id, port }." };
  }
  const obj = ref as { node_id?: unknown; nodeId?: unknown; port?: unknown };
  const nodeId =
    typeof obj.node_id === "string"
      ? obj.node_id
      : typeof obj.nodeId === "string"
        ? obj.nodeId
        : null;
  if (!nodeId) return { error: "Missing node_id." };
  if (typeof obj.port !== "string") return { error: "Missing port." };
  return { nodeId, port: obj.port };
}

function statePayload() {
  return {
    revision: canvasStore.getState().meta.revision,
    canvas: getCanvasStateForAgent(),
  };
}

export function executeCanvasTool(
  name: string,
  args: Record<string, unknown>,
): unknown {
  switch (name) {
    case "canvas_get_state": {
      return getCanvasStateForAgent();
    }

    case "canvas_list_widgets": {
      const state = canvasStore.getState();
      return {
        widgets: Object.values(state.nodes).map((node) => ({
          id: node.id,
          type: node.type,
          title: node.title,
          input: node.input,
          outputs: state.outputs[node.id] ?? {},
          layout: state.layout[node.id] ?? null,
          contract: getWidgetContract(node.type) ?? null,
        })),
        revision: state.meta.revision,
      };
    }

    case "canvas_add_widget": {
      const type = typeof args.type === "string" ? args.type : "";
      if (!type || !widgetContracts[type]) {
        return { ok: false, reason: `Unknown widget type "${type}".` };
      }
      const nodeId = canvasStore.addWidget({
        id: typeof args.id === "string" ? args.id : undefined,
        type,
        title: typeof args.title === "string" ? args.title : undefined,
        input: (args.input as WidgetInput) ?? {},
        layout: args.layout as CanvasLayout | undefined,
        source: "agent",
      });
      const state = canvasStore.getState();
      return {
        ok: true,
        node_id: nodeId,
        node: state.nodes[nodeId],
        layout: state.layout[nodeId],
        ...statePayload(),
      };
    }

    case "canvas_update_widget_input": {
      const nodeId = typeof args.node_id === "string" ? args.node_id : "";
      if (!nodeId) return { ok: false, reason: "Missing node_id." };
      if (!canvasStore.getState().nodes[nodeId]) {
        return { ok: false, reason: `Unknown node ${nodeId}.` };
      }
      canvasStore.updateWidgetInput(
        nodeId,
        (args.input as WidgetInput) ?? {},
        "agent",
      );
      return {
        ok: true,
        node_id: nodeId,
        node: canvasStore.getState().nodes[nodeId],
        ...statePayload(),
      };
    }

    case "canvas_remove_widget": {
      const nodeId = typeof args.node_id === "string" ? args.node_id : "";
      if (!nodeId) return { ok: false, reason: "Missing node_id." };
      const state = canvasStore.getState();
      const existing = state.nodes[nodeId];
      if (!existing) return { ok: false, reason: `Unknown node ${nodeId}.` };
      const removedBridgeIds = Object.values(state.edges)
        .filter(
          (edge) => edge.from.nodeId === nodeId || edge.to.nodeId === nodeId,
        )
        .map((edge) => edge.id);
      canvasStore.removeWidget(nodeId, "agent");
      return {
        ok: true,
        removed_node_id: nodeId,
        removed_bridge_ids: removedBridgeIds,
        ...statePayload(),
      };
    }

    case "canvas_set_layout": {
      const nodeId = typeof args.node_id === "string" ? args.node_id : "";
      if (!nodeId) return { ok: false, reason: "Missing node_id." };
      if (!canvasStore.getState().nodes[nodeId]) {
        return { ok: false, reason: `Unknown node ${nodeId}.` };
      }
      const layout = args.layout as CanvasLayout | undefined;
      if (!layout) return { ok: false, reason: "Missing layout." };
      canvasStore.setLayout(nodeId, layout, "agent");
      return {
        ok: true,
        node_id: nodeId,
        layout: canvasStore.getState().layout[nodeId],
        ...statePayload(),
      };
    }

    case "canvas_add_bridge": {
      const from = readNodeRef(args.from);
      const to = readNodeRef(args.to);
      if ("error" in from) return { ok: false, reason: `from: ${from.error}` };
      if ("error" in to) return { ok: false, reason: `to: ${to.error}` };
      const result = canvasStore.addBridge({
        id: typeof args.id === "string" ? args.id : undefined,
        from,
        to,
        transform: normalizeTransform(args.transform),
        createdBy: "agent",
      });
      if (!result.ok) return result;
      const state = canvasStore.getState();
      return {
        ok: true,
        bridge_id: result.bridgeId,
        bridge: state.edges[result.bridgeId],
        propagated: result.propagated,
        target_node: state.nodes[to.nodeId],
        ...statePayload(),
      };
    }

    case "canvas_remove_bridge": {
      const bridgeId =
        typeof args.bridge_id === "string" ? args.bridge_id : "";
      if (!bridgeId) return { ok: false, reason: "Missing bridge_id." };
      if (!canvasStore.getState().edges[bridgeId]) {
        return { ok: false, reason: `Unknown bridge ${bridgeId}.` };
      }
      canvasStore.removeBridge(bridgeId, "agent");
      return {
        ok: true,
        removed_bridge_id: bridgeId,
        ...statePayload(),
      };
    }

    case "canvas_preview_bridge": {
      const from = readNodeRef(args.from);
      const to = readNodeRef(args.to);
      if ("error" in from) return { ok: false, reason: `from: ${from.error}` };
      if ("error" in to) return { ok: false, reason: `to: ${to.error}` };

      const state = canvasStore.getState();
      const transform = normalizeTransform(args.transform);

      if (transform && !getTransform(transform.id)) {
        return { ok: false, reason: `Unknown transform "${transform.id}".` };
      }

      const candidate: Bridge = {
        id: "preview",
        from,
        to,
        transform,
        direction: "forward",
        createdBy: "agent",
      };
      const validation = validateBridge(state, candidate);
      if (!validation.ok) return validation;

      const sourceOutputs = state.outputs[from.nodeId];
      const sourceValue =
        sourceOutputs && from.port in sourceOutputs
          ? sourceOutputs[from.port]
          : undefined;
      const transformed = applyTransform(transform, sourceValue);

      const toContract = getWidgetContract(state.nodes[to.nodeId].type);
      const targetSchema = toContract?.inputs[to.port]?.schema ?? null;

      return {
        ok: true,
        target_value: transformed,
        target_schema: targetSchema,
        source_had_output: sourceValue !== undefined,
      };
    }

    case "canvas_list_transforms": {
      return {
        transforms: listTransforms().map(({ apply: _apply, ...rest }) => rest),
      };
    }

    default:
      return { ok: false, reason: `Unknown canvas tool ${name}.` };
  }
}
