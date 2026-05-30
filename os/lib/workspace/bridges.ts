import { getWidgetContract } from "@/lib/workspace/contracts";
import { getTransform } from "@/lib/workspace/transforms";
import type {
  Bridge,
  BridgeSuggestion,
  CanvasState,
  JsonSchema,
  NodeId,
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
  if (transform.id === "identity") return schemasCompatible(fromSchema, toSchema);
  const registered = getTransform(transform.id);
  if (!registered) return false;
  return (
    schemasCompatible(fromSchema, registered.inputSchema) &&
    schemasCompatible(registered.outputSchema, toSchema)
  );
}

function suggestedTransform(
  outName: string,
  inName: string,
  fromSchema: JsonSchema,
  toSchema: JsonSchema,
): TransformRef | undefined {
  if (
    inName === "markers" &&
    fromSchema.type === "array" &&
    toSchema.$id === "fluid.place.array" &&
    outName.toLowerCase().includes("contact")
  ) {
    return { id: "recordsToMarkers" };
  }
  return undefined;
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

function schemaScore(from: JsonSchema, to: JsonSchema): number {
  if (from.$id && to.$id && from.$id === to.$id) return 3;
  const fromTypes = asArray(from.type);
  const toTypes = asArray(to.type);
  if (toTypes.includes("array") && fromTypes.includes("array")) return 2;
  if (toTypes.includes("object") && fromTypes.includes("object")) return 1;
  return 0;
}

function semanticScore(fromPort: string, toPort: string): number {
  const from = fromPort.toLowerCase();
  const to = toPort.toLowerCase();
  let score = 0;

  if (from.startsWith("selected") && /^(row|rows|item|items|record|records)$/.test(to)) {
    score += 3;
  }
  if (from.startsWith("selected") && /^(contacts|groups|events|tasks|notes|files)$/.test(to)) {
    score -= 2;
  }
  if (from.endsWith(to) || to.endsWith(from)) {
    score += 1;
  }

  return score;
}

function bridgeAlreadyExists(
  state: CanvasState,
  from: { nodeId: NodeId; port: string },
  to: { nodeId: NodeId; port: string },
): boolean {
  return Object.values(state.edges).some(
    (edge) =>
      edge.from.nodeId === from.nodeId &&
      edge.from.port === from.port &&
      edge.to.nodeId === to.nodeId &&
      edge.to.port === to.port,
  );
}

export function suggestBridges(
  state: CanvasState,
  newNodeId: NodeId,
): BridgeSuggestion[] {
  const newNode = state.nodes[newNodeId];
  if (!newNode) return [];
  const newContract = getWidgetContract(newNode.type);
  if (!newContract) return [];

  const suggestions: BridgeSuggestion[] = [];

  for (const [existingId, existingNode] of Object.entries(state.nodes)) {
    if (existingId === newNodeId) continue;
    const existingContract = getWidgetContract(existingNode.type);
    if (!existingContract) continue;

    // existing.output -> new.input
    for (const [outName, outPort] of Object.entries(existingContract.outputs)) {
      for (const [inName, inPort] of Object.entries(newContract.inputs)) {
        if (!schemasCompatible(outPort.schema, inPort.schema)) continue;
        if (
          bridgeAlreadyExists(
            state,
            { nodeId: existingId, port: outName },
            { nodeId: newNodeId, port: inName },
          )
        )
          continue;
        suggestions.push({
          from: { nodeId: existingId, port: outName },
          to: { nodeId: newNodeId, port: inName },
          fromType: existingNode.type,
          toType: newNode.type,
          transform: suggestedTransform(outName, inName, outPort.schema, inPort.schema),
          score:
            schemaScore(outPort.schema, inPort.schema) +
            semanticScore(outName, inName),
        });
      }
    }

    // new.output -> existing.input
    for (const [outName, outPort] of Object.entries(newContract.outputs)) {
      for (const [inName, inPort] of Object.entries(existingContract.inputs)) {
        if (!schemasCompatible(outPort.schema, inPort.schema)) continue;
        if (
          bridgeAlreadyExists(
            state,
            { nodeId: newNodeId, port: outName },
            { nodeId: existingId, port: inName },
          )
        )
          continue;
        suggestions.push({
          from: { nodeId: newNodeId, port: outName },
          to: { nodeId: existingId, port: inName },
          fromType: newNode.type,
          toType: existingNode.type,
          transform: suggestedTransform(outName, inName, outPort.schema, inPort.schema),
          score:
            schemaScore(outPort.schema, inPort.schema) +
            semanticScore(outName, inName),
        });
      }
    }
  }

  const bestPerTargetPort = new Map<string, BridgeSuggestion>();
  for (const s of suggestions) {
    const key = `${s.to.nodeId}:${s.to.port}`;
    const current = bestPerTargetPort.get(key);
    if (!current || s.score > current.score) bestPerTargetPort.set(key, s);
  }
  return [...bestPerTargetPort.values()].sort((a, b) => b.score - a.score);
}
