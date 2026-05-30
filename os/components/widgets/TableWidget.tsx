"use client";

import type { WorkspaceTable } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TableWidget({
  table,
  variant = "card",
}: {
  table: WorkspaceTable;
  variant?: "card" | "embedded";
}) {
  const content = <TableContent table={table} />;

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

function TableContent({ table }: { table: WorkspaceTable }) {
  if (table.rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No rows yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
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
            <tr key={row.id} className="border-b border-border/50">
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
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
