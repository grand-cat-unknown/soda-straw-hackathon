"use client";

import type { WidgetComponentProps, WorkspaceCanvas } from "@/lib/workspace";

export function CanvasSummaryWidget({ input, emitOutput }: WidgetComponentProps) {
  const canvas = input.canvas as WorkspaceCanvas | undefined;

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
