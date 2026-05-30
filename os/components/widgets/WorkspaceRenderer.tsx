"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, MapPinned, Pencil, Trash2, X } from "lucide-react";

import { MapWidget, type MapMarker, type MapRoute } from "@/components/widgets/MapWidget";
import { TableWidget } from "@/components/widgets/TableWidget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  canvasStore,
  getWidgetContract,
  useCanvasState,
  widgetRegistry,
} from "@/lib/workspace";
import type {
  WidgetInput,
  WidgetNode,
  WorkspaceCanvas,
  WorkspaceTable,
} from "@/lib/workspace";

export function WorkspaceRenderer() {
  const canvas = useCanvasState();
  const nodes = Object.values(canvas.nodes);

  if (nodes.length === 0) return null;

  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <WidgetFrame key={node.id} node={node}>
          <WidgetBody
            node={node}
            input={node.input}
            emitOutput={(port, value) =>
              canvasStore.emitOutput(node.id, port, value)
            }
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
  const contract = getWidgetContract(node.type);
  const canvas = useCanvasState();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(node.input, null, 2));
  const [error, setError] = useState("");
  const outputs = canvas.outputs[node.id] ?? {};

  useEffect(() => {
    if (!isEditing) setDraft(JSON.stringify(node.input, null, 2));
  }, [isEditing, node.input]);

  function saveInput() {
    try {
      const parsed = JSON.parse(draft) as WidgetInput;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setError("Input must be a JSON object.");
        return;
      }
      canvasStore.updateWidgetInput(node.id, parsed, "user");
      setError("");
      setIsEditing(false);
    } catch {
      setError("Invalid JSON.");
    }
  }

  function removeWidget() {
    if (window.confirm(`Remove ${node.title}?`)) {
      canvasStore.removeWidget(node.id, "user");
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="break-words text-lg">{node.title}</CardTitle>
            <CardDescription>
              {definition?.description ?? `Generic ${node.type} widget`}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={isEditing ? "Close editor" : "Edit widget input"}
              title={isEditing ? "Close editor" : "Edit widget input"}
              onClick={() => {
                setError("");
                setIsEditing((value) => !value);
              }}
            >
              {isEditing ? <X aria-hidden /> : <Pencil aria-hidden />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove widget"
              title="Remove widget"
              onClick={removeWidget}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>
        {contract ? (
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(contract.inputs).map((port) => (
              <span
                key={`in:${port}`}
                className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                in:{port}
              </span>
            ))}
            {Object.keys(contract.outputs).map((port) => (
              <span
                key={`out:${port}`}
                className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                out:{port}
              </span>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
            <Textarea
              aria-label={`${node.title} input JSON`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[180px] font-mono text-xs"
              spellCheck={false}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="min-h-5 text-xs text-destructive">{error}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft(JSON.stringify(node.input, null, 2));
                    setError("");
                    setIsEditing(false);
                  }}
                >
                  <X aria-hidden />
                  Cancel
                </Button>
                <Button type="button" onClick={saveInput}>
                  <Check aria-hidden />
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {children}
        {Object.keys(outputs).length > 0 ? (
          <details className="rounded-md border border-border bg-muted/40 p-3">
            <summary className="cursor-pointer text-xs font-medium">
              Outputs
            </summary>
            <pre className="mt-2 max-h-52 overflow-auto text-xs">
              {JSON.stringify(outputs, null, 2)}
            </pre>
          </details>
        ) : null}
      </CardContent>
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
      return (
        <CanvasSummary
          canvas={input.canvas as WorkspaceCanvas | undefined}
          emitOutput={emitOutput}
        />
      );
    case "table": {
      const table = input.table as WorkspaceTable | undefined;
      return table ? (
        <TableWidget
          table={table}
          variant="embedded"
          onSelectedRowsChange={(rows) => emitOutput("selectedRows", rows)}
        />
      ) : (
        <ToolResult value={input} emitOutput={emitOutput} />
      );
    }
    case "map": {
      const markers = (input.markers as MapMarker[] | undefined) ?? [];
      return (
        <div className="space-y-3">
          <MapWidget
            markers={markers}
            route={(input.route as MapRoute | null | undefined) ?? null}
            className="h-[360px]"
            onMarkerClick={(marker) => emitOutput("selectedMarker", marker)}
          />
          {markers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {markers.map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                  onClick={() => emitOutput("selectedMarker", marker)}
                >
                  {marker.label ?? marker.id}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case "marker-detail":
      return (
        <MarkerDetail
          marker={input.marker as MapMarker | null | undefined}
          emitOutput={emitOutput}
        />
      );
    case "tool-result":
      return <ToolResult value={input.value ?? input} emitOutput={emitOutput} />;
    default:
      return <ToolResult value={input} emitOutput={emitOutput} />;
  }
}

function CanvasSummary({
  canvas,
  emitOutput,
}: {
  canvas?: WorkspaceCanvas;
  emitOutput: (port: string, value: unknown) => void;
}) {
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
          {(canvas.actions ?? []).map((action, index) => (
            <button
              key={`${action.label}:${index}`}
              type="button"
              className="rounded-md border border-border bg-muted px-2 py-1 text-xs transition hover:bg-accent"
              onClick={() => emitOutput("actionRequested", action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MarkerDetail({
  marker,
  emitOutput,
}: {
  marker?: MapMarker | null;
  emitOutput: (port: string, value: unknown) => void;
}) {
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-medium">{marker.label ?? marker.id}</div>
          <div className="text-muted-foreground">
            {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => emitOutput("marker", marker)}
        >
          Use marker
        </Button>
      </div>
    </div>
  );
}

function ToolResult({
  value,
  emitOutput,
}: {
  value: unknown;
  emitOutput?: (port: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-2">
      {emitOutput ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => emitOutput("value", value)}
          >
            Emit value
          </Button>
        </div>
      ) : null}
      <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
