import type { JsonSchema } from "@/lib/workspace/types";

export const AnySchema: JsonSchema = { $id: "fluid.any" };

export const StringSchema: JsonSchema = { $id: "fluid.string", type: "string" };

export const NumberSchema: JsonSchema = { $id: "fluid.number", type: "number" };

export const UnknownArraySchema: JsonSchema = {
  $id: "fluid.array",
  type: "array",
};

export const TableSchema: JsonSchema = {
  $id: "fluid.table",
  type: "object",
  required: ["id", "name", "columns", "rows"],
  properties: {
    id: StringSchema,
    name: StringSchema,
    columns: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "type"],
        properties: {
          name: StringSchema,
          type: StringSchema,
        },
      },
    },
    rows: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "values"],
        properties: {
          id: StringSchema,
          values: { type: "object" },
        },
      },
    },
  },
};

export const PlaceSchema: JsonSchema = {
  $id: "fluid.place",
  type: "object",
  required: ["id", "lng", "lat"],
  properties: {
    id: StringSchema,
    lng: NumberSchema,
    lat: NumberSchema,
    label: StringSchema,
    color: StringSchema,
  },
};

export const PlaceArraySchema: JsonSchema = {
  $id: "fluid.place.array",
  type: "array",
  items: PlaceSchema,
};

export const RouteSchema: JsonSchema = {
  $id: "fluid.route",
  type: "object",
  required: ["geometry"],
  properties: {
    geometry: {
      type: "object",
      required: ["type", "coordinates"],
      properties: {
        type: { type: "string", enum: ["LineString"] },
        coordinates: { type: "array" },
      },
    },
    color: StringSchema,
  },
};

export const CanvasSchema: JsonSchema = {
  $id: "fluid.canvas",
  type: "object",
};

export const UnknownRecordSchema: JsonSchema = {
  $id: "fluid.record",
  type: "object",
};

export const CalculatorResultSchema: JsonSchema = {
  $id: "fluid.calculator.result",
  type: "object",
  properties: {
    value: NumberSchema,
    expression: StringSchema,
    ranked: UnknownArraySchema,
  },
};
