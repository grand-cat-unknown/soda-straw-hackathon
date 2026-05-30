"use client";

import { useState } from "react";
import { Check, NotebookText, Pencil, Send, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  formatDateTime,
  getString,
  isRecord,
} from "@/components/widgets/widget-utils";

export function NotesWidget({ node, input, emitOutput, runAction }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const notes = asRecords(result.notes).length
    ? asRecords(result.notes)
    : isRecord(result.note)
      ? [result.note]
      : isRecord(input.note)
        ? [input.note]
        : [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  if (notes.length === 0) {
    return (
      <EmptyWidget icon={<NotebookText className="h-4 w-4" aria-hidden />}>
        No notes yet.
      </EmptyWidget>
    );
  }

  const canUpdate = Boolean(node.actions?.updateNote);
  const canDelete = Boolean(node.actions?.deleteNote);

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {notes.map((note, index) => {
        const noteId = getString(note, "id");
        const title = getString(note, "title") ?? `Note ${index + 1}`;
        const body = getString(note, "body") ?? "";
        const updatedAt = getString(note, "updated_at");
        const isEditing = editingId !== null && noteId === editingId;

        return (
          <li key={noteId ?? `${title}:${index}`} className="group px-2 py-1.5 text-sm">
            {isEditing ? (
              <div className="space-y-1">
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  className="w-full rounded border border-input bg-background px-2 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <textarea
                  value={draftBody}
                  onChange={(event) => setDraftBody(event.target.value)}
                  rows={3}
                  className="w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex justify-end gap-1">
                  <Button type="button" size="xs" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      if (noteId) {
                        void runAction("updateNote", {
                          note_id: noteId,
                          title: draftTitle,
                          body: draftBody,
                        });
                      }
                      setEditingId(null);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{title}</span>
                    {updatedAt ? (
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                        {formatDateTime(updatedAt)}
                      </span>
                    ) : null}
                  </div>
                  {body ? (
                    <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {body}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {canUpdate && noteId ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit note"
                      onClick={() => {
                        setEditingId(noteId);
                        setDraftTitle(title);
                        setDraftBody(body);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Use note"
                    title="Send to connected widgets"
                    onClick={() => emitOutput("selectedNote", note)}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                  {canDelete && noteId ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Delete note"
                      onClick={() => void runAction("deleteNote", { note_id: noteId })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
