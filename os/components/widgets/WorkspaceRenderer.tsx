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
  refreshWidgetBindings,
  runWidgetAction,
  shouldRefreshBindingOnMount,
  useCanvasState,
  widgetRegistry,
} from "@/lib/workspace";
import type {
  Bridge,
  CanvasLayout,
  TileSize,
  WidgetInput,
  WidgetNode,
} from "@/lib/workspace";
import { CANVAS_COLS, TILE_DIMENSIONS } from "@/lib/workspace";
import {
  fallbackWidgetRenderer,
  widgetRenderers,
} from "@/components/widgets/widget-renderers";

// Tile grid: 6 columns, ~240px row height. Agent picks a TileSize + (col,row).
// If two tiles collide, the later one is bumped via first-fit packing.
const CELL_HEIGHT_PX = 240;
const SVG_COL_WIDTH = 100;

type Cell = { col: number; row: number; cols: number; rows: number };

function tileDims(size: TileSize): { cols: number; rows: number } {
  return TILE_DIMENSIONS[size];
}

function cellsOverlap(a: Cell, b: Cell): boolean {
  return (
    a.col < b.col + b.cols &&
    b.col < a.col + a.cols &&
    a.row < b.row + b.rows &&
    b.row < a.row + a.rows
  );
}

function firstFit(want: Cell, placed: Cell[]): Cell {
  // Try the requested slot first. If it conflicts, scan row-by-row, left-to-right
  // for the first slot that fits a tile of the same size.
  const isFree = (candidate: Cell) =>
    candidate.col + candidate.cols <= CANVAS_COLS &&
    !placed.some((p) => cellsOverlap(candidate, p));

  if (want.col + want.cols <= CANVAS_COLS && isFree(want)) return want;

  for (let row = 0; row < 1000; row += 1) {
    for (let col = 0; col <= CANVAS_COLS - want.cols; col += 1) {
      const candidate = { ...want, col, row };
      if (isFree(candidate)) return candidate;
    }
  }
  return { ...want, col: 0, row: 0 };
}

function resolvePlacements(
  nodes: WidgetNode[],
  layoutMap: Record<string, CanvasLayout>,
): Record<string, Cell> {
  const placed: Cell[] = [];
  const result: Record<string, Cell> = {};

  // Honor the agent's intended order (insertion order in nodes).
  for (const node of nodes) {
    const layout =
      layoutMap[node.id] ??
      getWidgetContract(node.type)?.render.defaultLayout ?? {
        size: "medium" as TileSize,
        col: 0,
        row: 0,
      };
    const { cols, rows } = tileDims(layout.size);
    const want: Cell = {
      col: Math.min(Math.max(0, layout.col), CANVAS_COLS - cols),
      row: Math.max(0, layout.row),
      cols,
      rows,
    };
    const fit = firstFit(want, placed);
    placed.push(fit);
    result[node.id] = fit;
  }

  return result;
}

export function WorkspaceRenderer({ debug = false }: { debug?: boolean }) {
  const canvas = useCanvasState();
  const nodes = Object.values(canvas.nodes);

  if (nodes.length === 0) return null;

  const placements = resolvePlacements(nodes, canvas.layout);
  const maxRow = Object.values(placements).reduce(
    (acc, p) => Math.max(acc, p.row + p.rows),
    1,
  );

  return (
    <div
      className="relative grid w-full gap-5"
      style={{
        gridTemplateColumns: `repeat(${CANVAS_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${maxRow}, ${CELL_HEIGHT_PX}px)`,
      }}
    >
      <BridgeOverlay
        edges={Object.values(canvas.edges)}
        placements={placements}
        maxRow={maxRow}
        debug={debug}
      />
      {nodes.map((node) => {
        const p = placements[node.id];
        return (
          <div
            key={node.id}
            className="relative z-10 min-w-0 transition-all duration-300 ease-out"
            style={{
              gridColumn: `${p.col + 1} / span ${p.cols}`,
              gridRow: `${p.row + 1} / span ${p.rows}`,
            }}
          >
            <WidgetFrame node={node} debug={debug}>
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

function BridgeOverlay({
  edges,
  placements,
  maxRow,
  debug,
}: {
  edges: Bridge[];
  placements: Record<string, Cell>;
  maxRow: number;
  debug: boolean;
}) {
  const visibleEdges = edges
    .map((edge) => {
      const from = placements[edge.from.nodeId];
      const to = placements[edge.to.nodeId];
      if (!from || !to) return null;

      const fromLeft = from.col * SVG_COL_WIDTH;
      const fromRight = (from.col + from.cols) * SVG_COL_WIDTH;
      const fromTop = from.row * CELL_HEIGHT_PX;
      const fromBottom = (from.row + from.rows) * CELL_HEIGHT_PX;
      const toLeft = to.col * SVG_COL_WIDTH;
      const toRight = (to.col + to.cols) * SVG_COL_WIDTH;
      const toTop = to.row * CELL_HEIGHT_PX;
      const toBottom = (to.row + to.rows) * CELL_HEIGHT_PX;

      const horizontalGap = Math.max(fromLeft - toRight, toLeft - fromRight, 0);
      const verticalGap = Math.max(fromTop - toBottom, toTop - fromBottom, 0);
      const sideBySide = horizontalGap >= verticalGap;

      let startX: number;
      let startY: number;
      let endX: number;
      let endY: number;

      if (sideBySide) {
        const fromIsLeft = fromRight <= toLeft || (fromLeft + fromRight) / 2 <= (toLeft + toRight) / 2;
        startX = fromIsLeft ? fromRight : fromLeft;
        endX = fromIsLeft ? toLeft : toRight;
        startY = (fromTop + fromBottom) / 2;
        endY = (toTop + toBottom) / 2;
      } else {
        const fromIsAbove = fromBottom <= toTop || (fromTop + fromBottom) / 2 <= (toTop + toBottom) / 2;
        startY = fromIsAbove ? fromBottom : fromTop;
        endY = fromIsAbove ? toTop : toBottom;
        startX = (fromLeft + fromRight) / 2;
        endX = (toLeft + toRight) / 2;
      }

      const path = `M ${startX} ${startY} L ${endX} ${endY}`;

      return {
        edge,
        path,
        labelX: (startX + endX) / 2,
        labelY: (startY + endY) / 2,
      };
    })
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

  if (visibleEdges.length === 0) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-visible"
      preserveAspectRatio="none"
      viewBox={`0 0 ${CANVAS_COLS * SVG_COL_WIDTH} ${maxRow * CELL_HEIGHT_PX}`}
    >
      <defs>
        <marker
          id="bridge-arrow"
          markerHeight="5"
          markerWidth="5"
          orient="auto"
          refX="5"
          refY="2.5"
          viewBox="0 0 5 5"
        >
          <path d="M 0 0 L 5 2.5 L 0 5 z" className="fill-primary/50" />
        </marker>
      </defs>
      {visibleEdges.map(({ edge, path, labelX, labelY }) => (
        <g key={edge.id}>
          <path
            d={path}
            className="fill-none stroke-primary/30"
            markerEnd="url(#bridge-arrow)"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          {debug ? (
            <foreignObject
              x={labelX - 52}
              y={labelY - 13}
              width="104"
              height="26"
            >
              <div className="mx-auto max-w-[104px] truncate rounded-full border border-border bg-card/95 px-2 py-1 text-center text-[10px] font-medium text-muted-foreground shadow-sm">
                {`${edge.from.port} -> ${edge.to.port}`}
              </div>
            </foreignObject>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function WidgetFrame({
  node,
  children,
  debug,
}: {
  node: WidgetNode;
  children: ReactNode;
  debug: boolean;
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
        {debug && contract ? (
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
            {node.bindings
              ? Object.keys(node.bindings).map((name) => (
                  <Badge key={`binding:${name}`} variant="secondary">
                    bind:{name}
                  </Badge>
                ))
              : null}
            {node.actions
              ? Object.keys(node.actions).map((name) => (
                  <Badge key={`action:${name}`} variant="outline">
                    action:{name}
                  </Badge>
                ))
              : null}
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
        {debug && Object.keys(outputs).length > 0 ? (
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
  const onMountBindings = JSON.stringify(
    Object.entries(node.bindings ?? {})
      .filter(([name, binding]) =>
        shouldRefreshBindingOnMount(node.type, name, binding),
      )
      .map(([name]) => name),
  );

  useEffect(() => {
    const bindingNames = JSON.parse(onMountBindings) as string[];
    console.log("[widget] mount effect", {
      nodeId: node.id,
      type: node.type,
      onMountBindings: bindingNames,
      allBindings: node.bindings,
    });
    if (bindingNames.length > 0) {
      void refreshWidgetBindings(node.id, bindingNames);
    }
  }, [node.id, node.type, node.bindings, onMountBindings]);

  return (
    <Renderer
      node={node}
      input={input}
      emitOutput={emitOutput}
      runAction={(actionName, payload) =>
        runWidgetAction(node, actionName, payload)
      }
      refreshBindings={(bindingNames) =>
        refreshWidgetBindings(node.id, bindingNames)
      }
    />
  );
}
