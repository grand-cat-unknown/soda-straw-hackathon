"use client";

import { TableWidget } from "@/components/widgets/TableWidget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Workspace, WorkspaceCanvas } from "@/lib/workspace";

export function CanvasHost({ workspace }: { workspace: Workspace }) {
  if (workspace.canvases.length === 0 && workspace.tables.length === 0) {
    return null;
  }

  const canvas: WorkspaceCanvas | undefined = workspace.canvases.at(-1);

  return (
    <div className="space-y-4">
      {canvas ? (
        <Card>
          <CardHeader>
            <CardTitle>{canvas.title}</CardTitle>
            <CardDescription>
              Layout: <code className="text-xs">{canvas.layout}</code>
              {" · "}
              {canvas.data_sources.length} data source
              {canvas.data_sources.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          {canvas.actions.length > 0 ? (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {canvas.actions.map((action) => (
                  <span
                    key={action.label}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-xs"
                  >
                    {action.label}
                  </span>
                ))}
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {workspace.tables.map((table) => (
        <TableWidget key={table.id} table={table} />
      ))}
    </div>
  );
}
