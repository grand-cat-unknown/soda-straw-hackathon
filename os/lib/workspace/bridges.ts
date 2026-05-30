import { getWidgetContract } from "@/lib/workspace/contracts";
import { getTransform } from "@/lib/workspace/transforms";
import type {
  Bridge,
  CanvasState,
  JsonSchema,
  TransformRef,
} from "@/lib/workspace/types";

export type BridgeValidationResult =
  | { ok: true; bridge: Bridge }
  | { ok: false; reason: string };

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function typeMatches(from: JsonSchema, to: JsonSchema): boolean {
  const fromTypes = asArray(from.type);
  const toTypes = asArray(to.type);
  if (fromTypes.length === 0 || toTypes.length === 0) return true;
  return fromTypes.some((type) => toTypes.includes(type));
}

export function schemasCompatible(from: JsonSchema, to: JsonSchema): boolean {
  if (from.$id && to.$id && from.$id === to.$id) return true;
  if (!typeMatches(from, to)) return false;

  const toTypes = asArray(to.type);
  if (toTypes.includes("array")) {
    if (!from.items || !to.items) return true;
    return schemasCompatible(from.items, to.items);
  }

  if (toTypes.includes("object") && to.required && to.required.length > 0) {
    if (!from.properties || !to.properties) return false;
    return to.required.every((key) => {
      const sourceProperty = from.properties?.[key];
      const targetProperty = to.properties?.[key];
      if (!sourceProperty || !targetProperty) return false;
      return schemasCompatible(sourceProperty, targetProperty);
    });
  }

  return true;
}

function transformCompatible(
  transform: TransformRef | undefined,
  fromSchema: JsonSchema,
  toSchema: JsonSchema,
): boolean {
  if (!transform) return schemasCompatible(fromSchema, toSchema);
  const registered = getTransform(transform.id);
  if (!registered) return false;
  return (
    schemasCompatible(fromSchema, registered.inputSchema) &&
    schemasCompatible(registered.outputSchema, toSchema)
  );
}

export function validateBridge(
  state: CanvasState,
  bridge: Bridge,
): BridgeValidationResult {
  if (bridge.direction === "bidirectional") {
    return { ok: false, reason: "Bidirectional bridges are not supported in v1." };
  }

  const fromNode = state.nodes[bridge.from.nodeId];
  const toNode = state.nodes[bridge.to.nodeId];
  if (!fromNode) return { ok: false, reason: `Unknown source node ${bridge.from.nodeId}.` };
  if (!toNode) return { ok: false, reason: `Unknown target node ${bridge.to.nodeId}.` };

  const fromContract = getWidgetContract(fromNode.type);
  const toContract = getWidgetContract(toNode.type);
  if (!fromContract) return { ok: false, reason: `No contract for ${fromNode.type}.` };
  if (!toContract) return { ok: false, reason: `No contract for ${toNode.type}.` };

  const fromPort = fromContract.outputs[bridge.from.port];
  const toPort = toContract.inputs[bridge.to.port];
  if (!fromPort) {
    return {
      ok: false,
      reason: `${fromNode.type} does not output ${bridge.from.port}.`,
    };
  }
  if (!toPort) {
    return {
      ok: false,
      reason: `${toNode.type} does not accept input ${bridge.to.port}.`,
    };
  }

  if (!transformCompatible(bridge.transform, fromPort.schema, toPort.schema)) {
    return {
      ok: false,
      reason: `Bridge ${bridge.from.port} -> ${bridge.to.port} is not schema-compatible.`,
    };
  }

  return { ok: true, bridge };
}
