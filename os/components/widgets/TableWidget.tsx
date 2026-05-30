"use client";

import { useMemo, useState } from "react";

import type { WidgetComponentProps, WorkspaceTable } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TableCanvasWidget({
  node,
  input,
  emitOutput,
  runAction,
}: WidgetComponentProps) {
  const table = input.table as WorkspaceTable | undefined;
  return table ? (
    <TableWidget
      table={table}
      variant="embedded"
      onSelectedRowsChange={(rows) => emitOutput("selectedRows", rows)}
      onAddRow={
        node.actions?.addRow
          ? () =>
              runAction("addRow", {
                table_id: table.id,
                values: Object.fromEntries(
                  table.columns.map((column) => [column.name, ""]),
                ),
              })
          : undefined
      }
    />
  ) : (
    <p className="text-sm text-muted-foreground">No table input.</p>
  );
}

export function TableWidget({
  table,
  variant = "card",
  onSelectedRowsChange,
  onAddRow,
}: {
  table: WorkspaceTable;
  variant?: "card" | "embedded";
  onSelectedRowsChange?: (rows: WorkspaceTable["rows"]) => void;
  onAddRow?: () => Promise<unknown>;
}) {
  const content = (
    <TableContent
      table={table}
      onSelectedRowsChange={onSelectedRowsChange}
      onAddRow={onAddRow}
    />
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
  onAddRow,
}: {
  table: WorkspaceTable;
  onSelectedRowsChange?: (rows: WorkspaceTable["rows"]) => void;
  onAddRow?: () => Promise<unknown>;
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
      {onSelectedRowsChange || onAddRow ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {selectedRows.length} selected
          </div>
          <div className="flex gap-2">
            {onAddRow ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void onAddRow()}
              >
                Add row
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectedRowsChange ? (
              <TableHead className="w-8">
                <span className="sr-only">Select row</span>
              </TableHead>
            ) : null}
            {table.columns.map((col) => (
              <TableHead key={col.name}>
                {col.name}
                <span className="ml-1 text-xs text-muted-foreground">
                  {col.type}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={selectedIds[row.id] ? "selected" : undefined}
            >
              {onSelectedRowsChange ? (
                <TableCell>
                  <Checkbox
                    checked={Boolean(selectedIds[row.id])}
                    onChange={() => toggleRow(row.id)}
                    aria-label={`Select ${row.id}`}
                  />
                </TableCell>
              ) : null}
              {table.columns.map((col) => (
                <TableCell key={col.name}>
                  {formatValue(row.values[col.name])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
