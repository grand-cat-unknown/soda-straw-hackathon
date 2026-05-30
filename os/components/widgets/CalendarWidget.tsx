"use client";

import { Bell, CalendarDays } from "lucide-react";

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

export function CalendarWidget({ input, emitOutput }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const events = [
    ...asRecords(result.events),
    ...asRecords(result.conflicts),
    ...(isRecord(result.event) ? [result.event] : []),
    ...(isRecord(input.event) ? [input.event] : []),
  ];
  const reminders = [
    ...asRecords(result.reminders),
    ...(isRecord(result.reminder) ? [result.reminder] : []),
    ...(isRecord(input.reminder) ? [input.reminder] : []),
  ];

  if (events.length === 0 && reminders.length === 0) {
    return (
      <EmptyWidget icon={<CalendarDays className="h-4 w-4" aria-hidden />}>
        No calendar items yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-4">
      {events.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Events
          </div>
          {events.map((event, index) => (
            <CalendarCard
              key={getString(event, "id") ?? `event:${index}`}
              item={event}
              primary={getString(event, "title") ?? `Event ${index + 1}`}
              secondary={[
                formatDateTime(getString(event, "starts_at")),
                formatDateTime(getString(event, "ends_at")),
              ]
                .filter(Boolean)
                .join(" - ")}
              meta={getString(event, "location")}
              onSelect={() => emitOutput("selectedEvent", event)}
            />
          ))}
        </section>
      ) : null}

      {reminders.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4" aria-hidden />
            Reminders
          </div>
          {reminders.map((reminder, index) => (
            <CalendarCard
              key={getString(reminder, "id") ?? `reminder:${index}`}
              item={reminder}
              primary={getString(reminder, "title") ?? `Reminder ${index + 1}`}
              secondary={formatDateTime(getString(reminder, "remind_at"))}
              meta={getString(reminder, "linked_entity")}
              onSelect={() => emitOutput("selectedReminder", reminder)}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function CalendarCard({
  primary,
  secondary,
  meta,
  onSelect,
}: {
  item: Record<string, unknown>;
  primary: string;
  secondary?: string;
  meta?: string;
  onSelect: () => void;
}) {
  return (
    <WidgetItem>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="break-words text-sm font-medium">{primary}</div>
          {secondary ? <div className="text-xs text-muted-foreground">{secondary}</div> : null}
          {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
        </div>
        <Button type="button" variant="outline" onClick={onSelect}>
          Select
        </Button>
      </div>
    </WidgetItem>
  );
}
