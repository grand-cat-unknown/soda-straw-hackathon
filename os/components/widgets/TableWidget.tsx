"use client";

import { useMemo, useState } from "react";

import type { WorkspaceTable } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TableWidget({
  table,
  variant = "card",
  onSelectedRowsChange,
}: {
  table: WorkspaceTable;
  variant?: "card" | "embedded";
  onSelectedRowsChange?: (rows: WorkspaceTable["rows"]) => void;
}) {
  const content = (
    <TableContent table={table} onSelectedRowsChange={onSelectedRowsChange} />
  );

  if (variant === "embedded") {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{table.name}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

function TableContent({
  table,
  onSelectedRowsChange,
}: {
  table: WorkspaceTable;
  onSelectedRowsChange?: (rows: WorkspaceTable["rows"]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Record<string, true>>({});
  const selectedRows = useMemo(
    () => table.rows.filter((row) => selectedIds[row.id]),
    [selectedIds, table.rows],
  );

  if (table.rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No rows yet.</p>;
  }

  function toggleRow(rowId: string) {
    const next = { ...selectedIds };
    if (next[rowId]) delete next[rowId];
    else next[rowId] = true;
    setSelectedIds(next);
    onSelectedRowsChange?.(table.rows.filter((row) => next[row.id]));
  }

  function selectAll() {
    const next: Record<string, true> = Object.fromEntries(
      table.rows.map((row) => [row.id, true]),
    );
    setSelectedIds(next);
    onSelectedRowsChange?.(table.rows);
  }

  function clearSelection() {
    setSelectedIds({});
    onSelectedRowsChange?.([]);
  }

  return (
    <div className="space-y-2">
      {onSelectedRowsChange ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {selectedRows.length} selected
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
              onClick={selectAll}
            >
              Select all
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
              onClick={clearSelection}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {onSelectedRowsChange ? (
                <th className="w-8 px-2 py-1">
                  <span className="sr-only">Select row</span>
                </th>
              ) : null}
              {table.columns.map((col) => (
                <th key={col.name} className="px-2 py-1 font-medium">
                  {col.name}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {col.type}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 data-[selected=true]:bg-accent/50"
                data-selected={Boolean(selectedIds[row.id])}
              >
                {onSelectedRowsChange ? (
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds[row.id])}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.id}`}
                      className="h-4 w-4 rounded border-border"
                    />
                  </td>
                ) : null}
                {table.columns.map((col) => (
                  <td key={col.name} className="px-2 py-1">
                    {formatValue(row.values[col.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
