"use client";

import { useState } from "react";
import { Check, CheckCircle2, Circle, ListChecks, Pencil, Send, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  formatDate,
  getString,
  isRecord,
} from "@/components/widgets/widget-utils";

export function TasksWidget({ node, input, emitOutput, runAction }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const tasks = asRecords(result.tasks).length
    ? asRecords(result.tasks)
    : isRecord(result.task)
      ? [result.task]
      : isRecord(input.task)
        ? [input.task]
        : [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  if (tasks.length === 0) {
    return (
      <EmptyWidget icon={<ListChecks className="h-4 w-4" aria-hidden />}>
        No tasks yet.
      </EmptyWidget>
    );
  }

  const openCount = tasks.filter((task) => getString(task, "status") !== "done").length;
  const canUpdate = Boolean(node.actions?.updateTask);
  const canDelete = Boolean(node.actions?.deleteTask);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{openCount} open · {tasks.length - openCount} done</span>
        <div className="flex gap-1">
          <Button type="button" size="xs" variant="ghost" onClick={() => emitOutput("status", "open")}>
            Open
          </Button>
          <Button type="button" size="xs" variant="ghost" onClick={() => emitOutput("status", "done")}>
            Done
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {tasks.map((task, index) => {
          const status = getString(task, "status") ?? "open";
          const title = getString(task, "title") ?? `Task ${index + 1}`;
          const taskId = getString(task, "id");
          const done = status === "done";
          const isEditing = editingId !== null && taskId === editingId;
          const due = getString(task, "due");
          const owner = getString(task, "owner");

          return (
            <li
              key={taskId ?? `${title}:${index}`}
              className="group flex items-center gap-2 px-2 py-1.5 text-sm"
            >
              <button
                type="button"
                aria-label={done ? "Mark as open" : "Mark as done"}
                disabled={!canUpdate || !taskId}
                onClick={() =>
                  taskId &&
                  void runAction("updateTask", {
                    task_id: taskId,
                    status: done ? "open" : "done",
                  })
                }
                className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </button>

              {isEditing ? (
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && taskId) {
                      void runAction("updateTask", { task_id: taskId, title: draftTitle });
                      setEditingId(null);
                    } else if (event.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className={`min-w-0 truncate ${done ? "text-muted-foreground line-through" : ""}`}>
                    {title}
                  </span>
                  {(owner || due) && (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      {[owner, due ? formatDate(due) : undefined].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              )}

              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Save"
                      onClick={() => {
                        if (taskId) {
                          void runAction("updateTask", { task_id: taskId, title: draftTitle });
                        }
                        setEditingId(null);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Cancel"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    {canUpdate && taskId ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Edit task"
                        onClick={() => {
                          setEditingId(taskId);
                          setDraftTitle(title);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Use task"
                      title="Send to connected widgets"
                      onClick={() => emitOutput("selectedTask", task)}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    {canDelete && taskId ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete task"
                        onClick={() => void runAction("deleteTask", { task_id: taskId })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
