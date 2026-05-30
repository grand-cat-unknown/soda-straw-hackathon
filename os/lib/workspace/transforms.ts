import { AnySchema } from "@/lib/workspace/schemas";
import type { JsonSchema, TransformRef } from "@/lib/workspace/types";

export type Transform = {
  id: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  apply: (value: unknown, params?: Record<string, unknown>) => unknown;
};

export function identity(value: unknown): unknown {
  return value;
}

export function pickField(
  value: unknown,
  params?: Record<string, unknown>,
): unknown {
  const field = typeof params?.field === "string" ? params.field : "";
  if (!field || !value || typeof value !== "object") return undefined;
  return (value as Record<string, unknown>)[field];
}

export function sortByKey(
  value: unknown,
  params?: Record<string, unknown>,
): unknown {
  if (!Array.isArray(value)) return value;
  const key = typeof params?.key === "string" ? params.key : "";
  const direction = params?.direction === "desc" ? "desc" : "asc";
  if (!key) return value;

  return [...value].sort((a, b) => {
    const left = a && typeof a === "object" ? (a as Record<string, unknown>)[key] : a;
    const right =
      b && typeof b === "object" ? (b as Record<string, unknown>)[key] : b;
    const comparison = String(left ?? "").localeCompare(String(right ?? ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return direction === "desc" ? -comparison : comparison;
  });
}

export function recordsToMarkers(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value
    .filter((record): record is Record<string, unknown> =>
      Boolean(record && typeof record === "object" && !Array.isArray(record)),
    )
    .map((record, index) => {
      const lat = Number(record.lat);
      const lng = Number(record.lng);
      return {
        ...record,
        id: String(record.id ?? `marker:${index}`),
        lat,
        lng,
        label: String(record.label ?? record.name ?? `Marker ${index + 1}`),
      };
    })
    .filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng));
}

const transforms: Record<string, Transform> = {
  identity: {
    id: "identity",
    description: "Pass the output value through unchanged.",
    inputSchema: AnySchema,
    outputSchema: AnySchema,
    apply: identity,
  },
  pickField: {
    id: "pickField",
    description: "Pick one field from an object.",
    inputSchema: { $id: "fluid.record", type: "object" },
    outputSchema: AnySchema,
    apply: pickField,
  },
  sortByKey: {
    id: "sortByKey",
    description: "Sort an array of objects by one key.",
    inputSchema: { $id: "fluid.array", type: "array" },
    outputSchema: { $id: "fluid.array", type: "array" },
    apply: sortByKey,
  },
  recordsToMarkers: {
    id: "recordsToMarkers",
    description: "Convert records with lat/lng and name/label fields into map markers while preserving extra fields.",
    inputSchema: { $id: "fluid.array", type: "array" },
    outputSchema: { $id: "fluid.place.array", type: "array" },
    apply: recordsToMarkers,
  },
};

export function registerTransform(transform: Transform): void {
  transforms[transform.id] = transform;
}

export function listTransforms(): Transform[] {
  return Object.values(transforms);
}

export function getTransform(id: string): Transform | undefined {
  return transforms[id];
}

export function applyTransform(
  ref: TransformRef | string | undefined,
  value: unknown,
): unknown {
  if (!ref) return value;
  const transformRef = typeof ref === "string" ? { id: ref } : ref;
  return (transforms[transformRef.id] ?? transforms.identity).apply(
    value,
    transformRef.params,
  );
}

export function applyGraphTransform(
  ref: TransformRef | string | undefined,
  value: unknown,
): unknown {
  return applyTransform(ref, value);
}
