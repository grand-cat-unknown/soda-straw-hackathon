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
  const Renderer = widgetRenderers[node.type] ?? fallbackWidgetRenderer;
  return <Renderer node={node} input={input} emitOutput={emitOutput} />;
}
