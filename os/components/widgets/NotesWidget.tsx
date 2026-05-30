"use client";

import { NotebookText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  formatDateTime,
  getString,
  isRecord,
  WidgetItem,
} from "@/components/widgets/widget-utils";

export function NotesWidget({ input, emitOutput }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const notes = asRecords(result.notes).length
    ? asRecords(result.notes)
    : isRecord(result.note)
      ? [result.note]
      : isRecord(input.note)
        ? [input.note]
        : [];

  if (notes.length === 0) {
    return (
      <EmptyWidget icon={<NotebookText className="h-4 w-4" aria-hidden />}>
        No notes yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note, index) => {
        const title = getString(note, "title") ?? `Note ${index + 1}`;
        const body = getString(note, "body") ?? "";
        return (
          <WidgetItem
            key={getString(note, "id") ?? `${title}:${index}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="break-words text-sm font-medium">{title}</div>
                {getString(note, "type") ? (
                  <div className="text-xs text-muted-foreground">{getString(note, "type")}</div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => emitOutput("selectedNote", note)}
              >
                Select
              </Button>
            </div>
            {body ? (
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                {body}
              </p>
            ) : null}
            {getString(note, "updated_at") ? (
              <div className="mt-2 text-xs text-muted-foreground">
                Updated {formatDateTime(getString(note, "updated_at"))}
              </div>
            ) : null}
          </WidgetItem>
        );
      })}
    </div>
  );
}
