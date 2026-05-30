"use client";

import type { ReactNode } from "react";
import { MapPinned } from "lucide-react";

import { MapWidget, type MapMarker, type MapRoute } from "@/components/widgets/MapWidget";
import { TableWidget } from "@/components/widgets/TableWidget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { widgetRegistry, useWorkspaceRuntime } from "@/lib/workspace";
import type {
  WidgetInput,
  WidgetNode,
  WorkspaceCanvas,
  WorkspaceGraph,
  WorkspaceTable,
} from "@/lib/workspace";

export function WorkspaceRenderer({ graph }: { graph: WorkspaceGraph }) {
  const { inputs, emitOutput } = useWorkspaceRuntime(graph);

  if (graph.nodes.length === 0) return null;

  return (
    <div className="space-y-4">
      {graph.nodes.map((node) => (
        <WidgetFrame key={node.id} node={node}>
          <WidgetBody
            node={node}
            input={inputs[node.id] ?? node.input}
            emitOutput={(port, value) => emitOutput(node.id, port, value)}
          />
        </WidgetFrame>
      ))}
    </div>
  );
}

function WidgetFrame({
  node,
  children,
}: {
  node: WidgetNode;
  children: ReactNode;
}) {
  const definition = widgetRegistry[node.type];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{node.title}</CardTitle>
        <CardDescription>
          {definition?.description ?? `Generic ${node.type} widget`}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function WidgetBody({
  node,
  input,
  emitOutput,
}: {
  node: WidgetNode;
  input: WidgetInput;
  emitOutput: (port: string, value: unknown) => void;
}) {
  switch (node.type) {
    case "canvas-summary":
      return <CanvasSummary canvas={input.canvas as WorkspaceCanvas | undefined} />;
    case "table": {
      const table = input.table as WorkspaceTable | undefined;
      return table ? (
        <TableWidget table={table} variant="embedded" />
      ) : (
        <ToolResult value={input} />
      );
    }
    case "map":
      return (
        <MapWidget
          markers={(input.markers as MapMarker[] | undefined) ?? []}
          route={(input.route as MapRoute | null | undefined) ?? null}
          className="h-[360px]"
          onMarkerClick={(marker) => emitOutput("selectedMarker", marker)}
        />
      );
    case "marker-detail":
      return <MarkerDetail marker={input.marker as MapMarker | null | undefined} />;
    case "tool-result":
      return <ToolResult value={input.value ?? input} />;
    default:
      return <ToolResult value={input} />;
  }
}

function CanvasSummary({ canvas }: { canvas?: WorkspaceCanvas }) {
  if (!canvas) {
    return <p className="text-sm text-muted-foreground">No canvas data.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs">
          {canvas.layout}
        </span>
        <span className="text-muted-foreground">
          {(canvas.data_sources ?? []).length} data source
          {(canvas.data_sources ?? []).length === 1 ? "" : "s"}
        </span>
      </div>

      {(canvas.actions ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {(canvas.actions ?? []).map((action) => (
            <span
              key={action.label}
              className="rounded-md border border-border bg-muted px-2 py-1 text-xs"
            >
              {action.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MarkerDetail({ marker }: { marker?: MapMarker | null }) {
  if (!marker) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPinned className="h-4 w-4" aria-hidden />
        Select a marker on the map.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="font-medium">{marker.label ?? marker.id}</div>
      <div className="text-muted-foreground">
        {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
      </div>
    </div>
  );
}

function ToolResult({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
