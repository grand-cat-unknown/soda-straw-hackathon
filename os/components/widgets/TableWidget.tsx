"use client";

import { useEffect, useMemo, useState } from "react";

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

type RecordValue = Record<string, unknown>;

export function TableCanvasWidget({
  node,
  input,
  emitOutput,
  runAction,
}: WidgetComponentProps) {
  const table = input.table as WorkspaceTable | undefined;
  const bridgedRows = useBridgedRows(input);
  const renderedTable = useMemo(
    () => (table ? mergeRows(table, bridgedRows) : undefined),
    [table, bridgedRows],
  );
  return renderedTable ? (
    <TableWidget
      table={renderedTable}
      variant="embedded"
      onSelectedRowsChange={(rows) => emitOutput("selectedRows", rows)}
      onAddRow={
        node.actions?.addRow
          ? (values) =>
              runAction("addRow", {
                table_id: renderedTable.id,
                values:
                  values ??
                  Object.fromEntries(
                    renderedTable.columns.map((column) => [column.name, ""]),
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
  onAddRow?: (values?: Record<string, unknown>) => Promise<unknown>;
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
  onAddRow?: (values?: Record<string, unknown>) => Promise<unknown>;
}) {
  const [selectedIds, setSelectedIds] = useState<Record<string, true>>({});
  const [newRow, setNewRow] = useState<Record<string, string>>({});
  const selectedRows = useMemo(
    () => table.rows.filter((row) => selectedIds[row.id]),
    [selectedIds, table.rows],
  );

  async function submitNewRow() {
    if (!onAddRow) return;
    const hasContent = Object.values(newRow).some((value) => value.trim().length > 0);
    if (!hasContent) return;
    const values = Object.fromEntries(
      table.columns.map((column) => [column.name, newRow[column.name] ?? ""]),
    );
    await onAddRow(values);
    setNewRow({});
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
          {table.rows.length === 0 && !onAddRow ? (
            <TableRow>
              <TableCell
                colSpan={table.columns.length + (onSelectedRowsChange ? 1 : 0)}
                className="text-sm text-muted-foreground"
              >
                No rows yet.
              </TableCell>
            </TableRow>
          ) : null}
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
          {onAddRow ? (
            <TableRow className="bg-muted/30">
              {onSelectedRowsChange ? <TableCell /> : null}
              {table.columns.map((col, index) => (
                <TableCell key={col.name} className="py-1">
                  <input
                    value={newRow[col.name] ?? ""}
                    placeholder={index === 0 ? `Add ${col.name}…` : col.name}
                    onChange={(event) =>
                      setNewRow((prev) => ({ ...prev, [col.name]: event.target.value }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void submitNewRow();
                      }
                    }}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </TableCell>
              ))}
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {onAddRow ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void submitNewRow()}
            disabled={!Object.values(newRow).some((v) => v.trim().length > 0)}
          >
            Add row
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asRecords(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function useBridgedRows(input: WidgetComponentProps["input"]): RecordValue[] {
  const [rows, setRows] = useState<RecordValue[]>([]);

  useEffect(() => {
    const incoming = [
      ...(isRecord(input.row) ? [input.row] : []),
      ...asRecords(input.rows),
    ];
    if (incoming.length === 0) return;

    setRows((current) => mergeRecordList(current, incoming));
  }, [input.row, input.rows]);

  return rows;
}

function mergeRecordList(
  current: RecordValue[],
  incoming: RecordValue[],
): RecordValue[] {
  const byKey = new Map(current.map((row) => [recordKey(row), row]));
  for (const row of incoming) {
    byKey.set(recordKey(row), row);
  }
  return [...byKey.values()];
}

function recordKey(record: RecordValue): string {
  return String(
    record.id ??
      record.email ??
      record.name ??
      JSON.stringify(record),
  );
}

function mergeRows(table: WorkspaceTable, records: RecordValue[]): WorkspaceTable {
  if (records.length === 0) return table;
  const existingIds = new Set(table.rows.map((row) => row.id));
  const appendedRows = records
    .map((record) => recordToTableRow(record, table.columns))
    .filter((row) => !existingIds.has(row.id));

  if (appendedRows.length === 0) return table;

  return {
    ...table,
    rows: [...table.rows, ...appendedRows],
  };
}

function recordToTableRow(
  record: RecordValue,
  columns: WorkspaceTable["columns"],
): WorkspaceTable["rows"][number] {
  if (isRecord(record.values)) {
    const values = record.values;
    return {
      id: String(record.id ?? `row:${recordKey(values)}`),
      values: Object.fromEntries(
        columns.map((column) => [column.name, values[column.name]]),
      ),
    };
  }

  return {
    id: String(record.id ?? `row:${recordKey(record)}`),
    values: Object.fromEntries(
      columns.map((column) => [column.name, record[column.name]]),
    ),
  };
}
