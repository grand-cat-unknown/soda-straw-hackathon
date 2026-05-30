"use client";

import { CheckCircle2, Circle, ListChecks, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  formatDate,
  getString,
  isRecord,
  WidgetItem,
  WidgetMeta,
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

  if (tasks.length === 0) {
    return (
      <EmptyWidget icon={<ListChecks className="h-4 w-4" aria-hidden />}>
        No tasks yet.
      </EmptyWidget>
    );
  }

  const openCount = tasks.filter((task) => getString(task, "status") !== "done")
    .length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {openCount} open, {tasks.length - openCount} done
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => emitOutput("status", "open")}
          >
            Open
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => emitOutput("status", "done")}
          >
            Done
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((task, index) => {
          const status = getString(task, "status") ?? "open";
          const title = getString(task, "title") ?? `Task ${index + 1}`;
          const taskId = getString(task, "id");
          const canUpdate = Boolean(node.actions?.updateTask && taskId);
          return (
            <WidgetItem
              key={getString(task, "id") ?? `${title}:${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                      <div className="break-words text-sm font-medium">{title}</div>
                  </div>
                  <WidgetMeta
                    items={[
                      status,
                      getString(task, "owner"),
                      getString(task, "due")
                        ? formatDate(getString(task, "due"))
                        : undefined,
                    ]}
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  {canUpdate ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        void runAction("updateTask", {
                          task_id: taskId,
                          status: status === "done" ? "open" : "done",
                        })
                      }
                    >
                      {status === "done" ? "Reopen" : "Done"}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Send ${title} to connected widgets`}
                    title="Send this task to connected widgets"
                    onClick={() => emitOutput("selectedTask", task)}
                  >
                    <Send aria-hidden />
                    Use task
                  </Button>
                </div>
              </div>
            </WidgetItem>
          );
        })}
      </div>
    </div>
  );
}
