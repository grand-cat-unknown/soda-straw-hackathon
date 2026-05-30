"use client";

import { canvasStore } from "@/lib/workspace/store";
import type {
  NodeId,
  ToolAction,
  ToolBinding,
  WidgetInput,
  WidgetNode,
} from "@/lib/workspace/types";

type CapabilityCallResponse = {
  output?: unknown;
  error?: string;
};

async function callCapability(
  capabilityId: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const response = await fetch("/api/capability-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capabilityId, params }),
  });
  const data = (await response.json()) as CapabilityCallResponse;
  if (!response.ok || data.error) {
    throw new Error(data.error ?? `Capability ${capabilityId} failed.`);
  }
  return data.output;
}

function pathSegments(path: string): string[] {
  return path
    .replace(/^\$\.?/, "")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
}

export function pickResultPath(value: unknown, path = "$"): unknown {
  if (path === "$" || path === "") return value;
  let current = value;
  for (const segment of pathSegments(path)) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current[Number(segment)];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function placesToMarkers(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((place, index) => {
    if (!place || typeof place !== "object") return place;
    const record = place as Record<string, unknown>;
    return {
      id: String(record.id ?? `place:${index}`),
      lat: Number(record.lat),
      lng: Number(record.lng),
      label: String(record.name ?? record.label ?? `Place ${index + 1}`),
    };
  });
}

function directionsToRoute(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const geometry = record.geometry;
  if (!geometry || typeof geometry !== "object") return value;
  return { geometry };
}

function applyTransform(value: unknown, transform?: string): unknown {
  switch (transform) {
    case "placesToMarkers":
      return placesToMarkers(value);
    case "directionsToRoute":
      return directionsToRoute(value);
    default:
      return value;
  }
}

function resolveBindingValue(output: unknown, binding: ToolBinding): unknown {
  const resultPath =
    binding.resultPath ??
    (binding as unknown as { result_path?: string }).result_path ??
    "$";
  return applyTransform(
    pickResultPath(output, resultPath),
    binding.transform,
  );
}

export async function refreshWidgetBindings(
  nodeId: NodeId,
  bindingNames?: string[],
): Promise<void> {
  const node = canvasStore.getState().nodes[nodeId];
  if (!node?.bindings) return;
  const requested = new Set(bindingNames);
  const updates: WidgetInput = {};

  for (const [name, binding] of Object.entries(node.bindings)) {
    if (requested.size > 0 && !requested.has(name)) continue;
    const capabilityId =
      binding.capabilityId ??
      (binding as unknown as { capability_id?: string }).capability_id;
    if (!capabilityId) continue;
    const output = await callCapability(capabilityId, binding.params ?? {});
    updates[name] = resolveBindingValue(output, binding);
  }

  if (Object.keys(updates).length > 0) {
    canvasStore.updateWidgetInput(nodeId, updates, "tool");
  }
}

function mergeParams(
  action: ToolAction,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return { ...(action.params ?? {}), ...payload };
}

export async function runWidgetAction(
  node: WidgetNode,
  actionName: string,
  payload: Record<string, unknown> = {},
): Promise<unknown> {
  const action = node.actions?.[actionName];
  if (!action) {
    throw new Error(`${node.title} does not define action ${actionName}.`);
  }
  const capabilityId =
    action.capabilityId ??
    (action as unknown as { capability_id?: string }).capability_id;
  if (!capabilityId) {
    throw new Error(`${actionName} does not define a capabilityId.`);
  }
  const output = await callCapability(
    capabilityId,
    mergeParams(action, payload),
  );
  const refresh =
    action.refreshBindings ??
    (action as unknown as { refresh_bindings?: string[] }).refresh_bindings ??
    [];
  if (refresh.length > 0) {
    await refreshWidgetBindings(node.id, refresh);
  }
  return output;
}
