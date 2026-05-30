"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarCheck, CalendarDays } from "lucide-react";

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

export function CalendarWidget({ input, emitOutput, runAction }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const selectedContacts = asRecords(input.selectedContacts);
  const availabilityContacts = useMemo(
    () =>
      selectedContacts.map((contact) => ({
        ...contact,
      })),
    [selectedContacts],
  );
  const availabilityContactKey = JSON.stringify(availabilityContacts);
  const [selectedDay, setSelectedDay] = useState(() =>
    typeof input.selectedDay === "string" ? input.selectedDay : defaultDateInputValue(),
  );
  const [dayStart, setDayStart] = useState(() =>
    typeof input.dayStart === "string" ? input.dayStart : "09:00",
  );
  const [dayEnd, setDayEnd] = useState(() =>
    typeof input.dayEnd === "string" ? input.dayEnd : "17:00",
  );
  const [availabilityResult, setAvailabilityResult] = useState<Record<string, unknown> | null>(
    null,
  );
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
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
  const availability = useMemo(
    () => [
      ...asRecords(input.availability),
      ...asRecords(result.availability),
      ...asRecords(availabilityResult?.availability),
    ],
    [availabilityResult, input.availability, result.availability],
  );

  useEffect(() => {
    setAvailabilityResult(null);
  }, [availabilityContactKey, dayEnd, dayStart, selectedDay]);

  async function checkAvailability() {
    setAvailabilityError(null);
    setIsCheckingAvailability(true);
    emitOutput("selectedDay", selectedDay);
    emitOutput("selectedTimeWindow", { dayStart, dayEnd });
    try {
      const output = await runAction("checkAvailability", {
        date: selectedDay,
        day_start: dayStart,
        day_end: dayEnd,
        contacts: availabilityContacts,
      });
      if (isRecord(output)) {
        emitAvailabilityOutputs(asRecords(output.availability), emitOutput);
      }
      setAvailabilityResult(isRecord(output) ? output : { availability: [] });
    } catch (error) {
      setAvailabilityError(
        error instanceof Error ? error.message : "Could not check availability.",
      );
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  if (events.length === 0 && reminders.length === 0 && selectedContacts.length === 0) {
    return (
      <EmptyWidget icon={<CalendarDays className="h-4 w-4" aria-hidden />}>
        No calendar items yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-4">
      {selectedContacts.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarCheck className="h-4 w-4" aria-hidden />
            Availability
          </div>
          <WidgetItem className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs text-muted-foreground">
                Day
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(event) => {
                    setSelectedDay(event.target.value);
                    emitOutput("selectedDay", event.target.value);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                From
                <input
                  type="time"
                  value={dayStart}
                  onChange={(event) => {
                    setDayStart(event.target.value);
                    emitOutput("selectedTimeWindow", {
                      dayStart: event.target.value,
                      dayEnd,
                    });
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                To
                <input
                  type="time"
                  value={dayEnd}
                  onChange={(event) => {
                    setDayEnd(event.target.value);
                    emitOutput("selectedTimeWindow", {
                      dayStart,
                      dayEnd: event.target.value,
                    });
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                />
              </label>
              <Button
                type="button"
                size="sm"
                onClick={() => void checkAvailability()}
                disabled={isCheckingAvailability}
              >
                {isCheckingAvailability ? "Checking" : "Check"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedContacts.length} selected
              </span>
            </div>
            {availabilityError ? (
              <div className="text-xs text-destructive">{availabilityError}</div>
            ) : null}
            {availability.length > 0 ? <AvailabilityList items={availability} /> : null}
          </WidgetItem>
        </section>
      ) : null}

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
              secondary={formatDateTimeRange(
                getString(event, "starts_at"),
                getString(event, "ends_at"),
              )}
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

function AvailabilityList({ items }: { items: Record<string, unknown>[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const contact = isRecord(item.contact) ? item.contact : undefined;
        const name =
          getString(contact, "name") ??
          getString(contact, "id") ??
          `Contact ${index + 1}`;
        const slots = asRecords(item.available);
        const busy = asRecords(item.busy);
        const status = availabilityStatusLabel(getString(item, "status"), busy.length);
        return (
          <div key={`${name}:${index}`} className="rounded-md bg-muted/40 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 truncate text-sm font-medium">{name}</div>
              <div className="text-xs capitalize text-muted-foreground">
                {status}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {slots.length > 0
                ? slots
                    .map((slot) =>
                      formatTimeRange(
                        getString(slot, "starts_at"),
                        getString(slot, "ends_at"),
                      ),
                    )
                    .filter(Boolean)
                    .join(", ")
                : "No open slots"}
            </div>
            {busy.length > 0 ? (
              <div className="mt-1 text-xs text-muted-foreground">
                Busy:{" "}
                {busy.map((event) => getString(event, "title") ?? "Event").join(", ")}
              </div>
            ) : null}
          </div>
        );
      })}
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

function defaultDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTimeRange(startsAt?: string, endsAt?: string): string {
  const start = formatDateTime(startsAt);
  const end = formatTime(endsAt);
  return [start, end].filter(Boolean).join(" - ");
}

function formatTimeRange(startsAt?: string, endsAt?: string): string {
  const start = formatTime(startsAt);
  const end = formatTime(endsAt);
  return [start, end].filter(Boolean).join(" - ");
}

function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function availabilityStatusLabel(status: string | undefined, busyCount: number): string {
  if (status === "partly_busy" || (status === "available" && busyCount > 0)) {
    return "Partly busy";
  }
  if (status === "busy") return "Busy";
  return "Available";
}

function emitAvailabilityOutputs(
  items: Record<string, unknown>[],
  emitOutput: WidgetComponentProps["emitOutput"],
) {
  const availableContacts: Record<string, unknown>[] = [];
  const partlyBusyContacts: Record<string, unknown>[] = [];
  const busyContacts: Record<string, unknown>[] = [];

  for (const item of items) {
    const contact = isRecord(item.contact) ? item.contact : undefined;
    if (!contact) continue;

    const busy = asRecords(item.busy);
    const available = asRecords(item.available);
    const status = getString(item, "status");

    if (status === "busy" || (busy.length > 0 && available.length === 0)) {
      busyContacts.push(contact);
    } else if (
      status === "partly_busy" ||
      (status === "available" && busy.length > 0)
    ) {
      partlyBusyContacts.push(contact);
    } else {
      availableContacts.push(contact);
    }
  }

  emitOutput("availableContacts", availableContacts);
  emitOutput("partlyBusyContacts", partlyBusyContacts);
  emitOutput("busyContacts", busyContacts);
}
