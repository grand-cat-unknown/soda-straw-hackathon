import { AnySchema } from "@/lib/workspace/schemas";
import type { JsonSchema, TransformRef } from "@/lib/workspace/types";

export type Transform = {
  id: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  apply: (value: unknown, params?: Record<string, unknown>) => unknown;
  generated?: boolean;
  source?: string;
};

type GeneratedTransformSpec =
  | { operation: "pickField"; field: string }
  | { operation: "sortByKey"; key: string; direction?: "asc" | "desc" }
  | { operation: "recordsToMarkers" }
  | {
      operation: "mapFields";
      fields: Record<string, string>;
      numericFields?: string[];
      array?: boolean;
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

function assertGeneratedSpecSize(source: string): void {
  if (source.length > 4000) {
    throw new Error("Generated transform spec is too long.");
  }
}

function readGeneratedTransformSpec(source: string): GeneratedTransformSpec {
  assertGeneratedSpecSize(source);
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("Generated transform source must be a JSON transform spec.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Generated transform spec must be an object.");
  }

  const spec = parsed as Record<string, unknown>;
  switch (spec.operation) {
    case "pickField":
      if (typeof spec.field !== "string" || !spec.field) {
        throw new Error("pickField requires a field.");
      }
      return { operation: "pickField", field: spec.field };
    case "sortByKey":
      if (typeof spec.key !== "string" || !spec.key) {
        throw new Error("sortByKey requires a key.");
      }
      return {
        operation: "sortByKey",
        key: spec.key,
        direction: spec.direction === "desc" ? "desc" : "asc",
      };
    case "recordsToMarkers":
      return { operation: "recordsToMarkers" };
    case "mapFields":
      if (!spec.fields || typeof spec.fields !== "object" || Array.isArray(spec.fields)) {
        throw new Error("mapFields requires a fields object.");
      }
      for (const [target, sourceField] of Object.entries(spec.fields)) {
        if (!target || typeof sourceField !== "string" || !sourceField) {
          throw new Error("mapFields entries must map target fields to source fields.");
        }
      }
      return {
        operation: "mapFields",
        fields: spec.fields as Record<string, string>,
        numericFields: Array.isArray(spec.numericFields)
          ? spec.numericFields.filter((field): field is string => typeof field === "string")
          : undefined,
        array: spec.array !== false,
      };
    default:
      throw new Error("Unsupported generated transform operation.");
  }
}

function mapRecordFields(
  record: unknown,
  fields: Record<string, string>,
  numericFields: Set<string>,
): unknown {
  if (!record || typeof record !== "object" || Array.isArray(record)) return {};
  const source = record as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(fields).map(([target, sourceField]) => {
      const value = source[sourceField];
      return [target, numericFields.has(target) ? Number(value) : value];
    }),
  );
}

function applyGeneratedSpec(
  spec: GeneratedTransformSpec,
  value: unknown,
  params?: Record<string, unknown>,
): unknown {
  switch (spec.operation) {
    case "pickField":
      return pickField(value, { field: spec.field, ...params });
    case "sortByKey":
      return sortByKey(value, {
        key: spec.key,
        direction: spec.direction,
        ...params,
      });
    case "recordsToMarkers":
      return recordsToMarkers(value);
    case "mapFields": {
      const numericFields = new Set(spec.numericFields ?? []);
      if (spec.array) {
        if (!Array.isArray(value)) return [];
        return value.map((record) => mapRecordFields(record, spec.fields, numericFields));
      }
      return mapRecordFields(value, spec.fields, numericFields);
    }
  }
}

export function createGeneratedTransform({
  id,
  description,
  inputSchema,
  outputSchema,
  source,
}: {
  id: string;
  description?: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  source: string;
}): Transform {
  const trimmed = source.trim();
  if (!/^[a-zA-Z0-9:_-]+$/.test(id)) {
    throw new Error("Transform id may only contain letters, numbers, ':', '_' and '-'.");
  }
  if (!trimmed) throw new Error("Generated transform spec is required.");
  const spec = readGeneratedTransformSpec(trimmed);

  return {
    id,
    description: description ?? "Generated bridge transform.",
    inputSchema: inputSchema ?? AnySchema,
    outputSchema: outputSchema ?? AnySchema,
    generated: true,
    source: trimmed,
    apply(value, params) {
      return applyGeneratedSpec(spec, value, params);
    },
  };
}

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
  const transform = transforms[transformRef.id] ?? transforms.identity;
  try {
    return transform.apply(value, transformRef.params);
  } catch (error) {
    console.warn(`Transform ${transform.id} failed.`, error);
    return undefined;
  }
}

export function applyGraphTransform(
  ref: TransformRef | string | undefined,
  value: unknown,
): unknown {
  return applyTransform(ref, value);
}
