import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RecordValue = Record<string, unknown>;

export function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function asRecords(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function getString(
  source: RecordValue | undefined,
  key: string,
): string | undefined {
  const value = source?.[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

export function getNumber(
  source: RecordValue | undefined,
  key: string,
): number | undefined {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function getArray(source: RecordValue | undefined, key: string): unknown[] {
  const value = source?.[key];
  return Array.isArray(value) ? value : [];
}

export function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatBytes(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  return `${(value / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function compactJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function EmptyWidget({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}

export function WidgetItem({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-card p-3", className)}>
      {children}
    </div>
  );
}

export function WidgetMeta({
  items,
  className,
}: {
  items: (string | undefined)[];
  className?: string;
}) {
  const visibleItems = items.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  if (visibleItems.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {visibleItems.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export function WidgetBadges({ items }: { items: unknown[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => {
        const label = compactJson(item);
        return (
          <Badge key={label} variant="outline" className="max-w-full truncate">
            {label}
          </Badge>
        );
      })}
    </div>
  );
}
