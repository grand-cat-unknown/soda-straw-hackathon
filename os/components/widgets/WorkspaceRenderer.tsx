"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/workspace";
import {
  fallbackWidgetRenderer,
  widgetRenderers,
} from "@/components/widgets/widget-renderers";

// Free-form canvas. x and w are percent of canvas width (0-100). y and h are row units.
const ROW_HEIGHT_PX = 72;
const GAP_PCT = 1;
const GAP_ROWS = 0.25;

type Placement = { x: number; y: number; w: number; h: number };

function rectsOverlap(a: Placement, b: Placement): boolean {
  return (
    a.x < b.x + b.w + GAP_PCT &&
    b.x < a.x + a.w + GAP_PCT &&
    a.y < b.y + b.h + GAP_ROWS &&
    b.y < a.y + a.h + GAP_ROWS
  );
}

function clamp(p: Placement): Placement {
  const w = Math.min(Math.max(2, p.w), 100);
  const h = Math.max(1, p.h);
  const x = Math.min(Math.max(0, p.x), 100 - w);
  const y = Math.max(0, p.y);
  return { x, y, w, h };
}

function resolvePlacements(
  nodes: WidgetNode[],
  layoutMap: Record<string, Placement>,
): Record<string, Placement> {
  const initial: Array<{ node: WidgetNode; placement: Placement }> = [];
  let flowY = 0;

  for (const node of nodes) {
    const explicit = layoutMap[node.id];
    if (explicit) {
      initial.push({ node, placement: clamp(explicit) });
    } else {
      const defaults = getWidgetContract(node.type)?.render.defaultLayout ?? {
        x: 0,
        y: 0,
        w: 50,
        h: 4,
      };
      initial.push({
        node,
        placement: clamp({ x: 0, y: flowY, w: defaults.w, h: defaults.h }),
      });
      flowY += defaults.h + GAP_ROWS;
    }
  }

  initial.sort(
    (a, b) => a.placement.y - b.placement.y || a.placement.x - b.placement.x,
  );

  const placed: Placement[] = [];
  const result: Record<string, Placement> = {};

  for (const { node, placement } of initial) {
    const p = { ...placement };
    let safety = 0;
    while (safety < 200) {
      safety += 1;
      const conflict = placed.find((other) => rectsOverlap(p, other));
      if (!conflict) break;
      p.y = conflict.y + conflict.h + GAP_ROWS;
    }
    placed.push(p);
    result[node.id] = p;
  }

  return result;
}

export function WorkspaceRenderer() {
  const canvas = useCanvasState();
  const nodes = Object.values(canvas.nodes);

  if (nodes.length === 0) return null;

  const placements = resolvePlacements(nodes, canvas.layout);
  const maxRow = Object.values(placements).reduce(
    (acc, p) => Math.max(acc, p.y + p.h),
    1,
  );

  return (
    <div
      className="relative w-full"
      style={{ height: `${maxRow * ROW_HEIGHT_PX}px` }}
    >
      {nodes.map((node) => {
        const p = placements[node.id];
        return (
          <div
            key={node.id}
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `${p.x}%`,
              top: `${p.y * ROW_HEIGHT_PX}px`,
              width: `calc(${p.w}% - 12px)`,
              height: `${p.h * ROW_HEIGHT_PX - 12}px`,
            }}
          >
            <WidgetFrame node={node}>
              <WidgetBody
                node={node}
                input={node.input}
                emitOutput={(port, value) =>
                  canvasStore.emitOutput(node.id, port, value)
                }
              />
            </WidgetFrame>
          </div>
        );
      })}
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
    <Card className="flex h-full flex-col overflow-hidden">
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
              <Badge
                key={`in:${port}`}
                variant="secondary"
              >
                in:{port}
              </Badge>
            ))}
            {Object.keys(contract.outputs).map((port) => (
              <Badge
                key={`out:${port}`}
                variant="outline"
              >
                out:{port}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-auto">
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
  const Renderer = widgetRenderers[node.type] ?? fallbackWidgetRenderer;
  return <Renderer node={node} input={input} emitOutput={emitOutput} />;
}
