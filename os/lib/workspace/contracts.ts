import {
  AnySchema,
  CanvasSchema,
  PlaceArraySchema,
  PlaceSchema,
  RouteSchema,
  TableSchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type {
  WidgetContract,
  WidgetDefinition,
  WidgetType,
} from "@/lib/workspace/types";

export const widgetContracts: Record<WidgetType, WidgetContract> = {
  "canvas-summary": {
    type: "canvas-summary",
    title: "Canvas",
    description: "Summarizes a generated Fluid OS canvas and its declared actions.",
    inputs: {
      canvas: {
        schema: CanvasSchema,
        description: "Canvas specification returned by the canvas capability.",
      },
    },
    outputs: {
      actionRequested: {
        schema: UnknownRecordSchema,
        description: "Canvas action the user clicked.",
      },
    },
  },
  table: {
    type: "table",
    title: "Table",
    description: "Renders structured rows returned by the tables capability.",
    inputs: {
      table: {
        schema: TableSchema,
        description: "Structured table data to render.",
      },
    },
    outputs: {
      selectedRows: {
        schema: { $id: "fluid.table.rows", type: "array" },
        description: "Rows selected by the user.",
      },
    },
  },
  map: {
    type: "map",
    title: "Map",
    description: "Renders places and routes, and publishes selected markers.",
    inputs: {
      markers: {
        schema: PlaceArraySchema,
        description: "Pins to drop on the map.",
      },
      route: {
        schema: RouteSchema,
        description: "Optional route to draw through the markers.",
        optional: true,
      },
    },
    outputs: {
      selectedMarker: {
        schema: PlaceSchema,
        description: "Marker the user last clicked.",
      },
    },
  },
  "marker-detail": {
    type: "marker-detail",
    title: "Selected place",
    description: "Shows the selected marker emitted by a map widget.",
    inputs: {
      marker: {
        schema: PlaceSchema,
        description: "Marker to show in the detail panel.",
        optional: true,
      },
    },
    outputs: {
      marker: {
        schema: PlaceSchema,
        description: "Marker the user confirmed from the detail panel.",
      },
    },
  },
  "tool-result": {
    type: "tool-result",
    title: "Tool result",
    description: "Renders a generic tool result when no specialized widget is declared.",
    inputs: {
      value: {
        schema: AnySchema,
        description: "Arbitrary tool result value.",
        optional: true,
      },
      fallback: {
        schema: UnknownRecordSchema,
        description: "Arbitrary record rendered as JSON.",
        optional: true,
      },
    },
    outputs: {
      value: {
        schema: AnySchema,
        description: "Tool result value the user emitted.",
      },
    },
  },
};

export function getWidgetContract(type: WidgetType): WidgetContract | undefined {
  return widgetContracts[type];
}

export function contractToDefinition(contract: WidgetContract): WidgetDefinition {
  return {
    type: contract.type,
    title: contract.title,
    description: contract.description,
    inputs: Object.entries(contract.inputs).map(([name, port]) => ({
      name,
      description: port.description,
    })),
    outputs: Object.entries(contract.outputs).map(([name, port]) => ({
      name,
      description: port.description,
    })),
  };
}

export const widgetRegistryFromContracts: Record<WidgetType, WidgetDefinition> =
  Object.fromEntries(
    Object.values(widgetContracts).map((contract) => [
      contract.type,
      contractToDefinition(contract),
    ]),
  );
