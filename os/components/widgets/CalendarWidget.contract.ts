import {
  AnySchema,
  StringSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const CalendarWidgetContract: WidgetContract = {
  type: "calendar",
  title: "Calendar",
  description: "Renders events, reminders, and conflict results.",
  inputs: {
    events: {
      schema: UnknownArraySchema,
      description: "Calendar events from calendar.list or conflicts.",
      optional: true,
    },
    reminders: {
      schema: UnknownArraySchema,
      description: "Reminders from calendar.list_reminders.",
      optional: true,
    },
    selectedContacts: {
      schema: UnknownArraySchema,
      description: "Contacts selected in another widget to check availability for.",
      optional: true,
    },
    availability: {
      schema: UnknownArraySchema,
      description: "Per-contact availability returned by calendar.availability.",
      optional: true,
    },
    selectedDay: {
      schema: StringSchema,
      description: "Selected availability date in YYYY-MM-DD format.",
      optional: true,
    },
    date: {
      schema: StringSchema,
      description: "Alias for selectedDay; accepted for calendar availability requests.",
      optional: true,
    },
    dayStart: {
      schema: StringSchema,
      description: "Start time for the selected day's availability window in HH:MM format.",
      optional: true,
    },
    dayEnd: {
      schema: StringSchema,
      description: "End time for the selected day's availability window in HH:MM format.",
      optional: true,
    },
    event: {
      schema: UnknownRecordSchema,
      description: "Single event from calendar.create.",
      optional: true,
    },
    reminder: {
      schema: UnknownRecordSchema,
      description: "Single reminder from calendar.create_reminder.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw calendar capability result.",
      optional: true,
    },
  },
  outputs: {
    selectedEvent: {
      schema: UnknownRecordSchema,
      description: "Event selected by the user.",
    },
    selectedReminder: {
      schema: UnknownRecordSchema,
      description: "Reminder selected by the user.",
    },
    selectedDay: {
      schema: StringSchema,
      description: "Day selected by the user for availability checks.",
    },
    selectedTimeWindow: {
      schema: UnknownRecordSchema,
      description: "Time window selected by the user for availability checks.",
    },
    availableContacts: {
      schema: UnknownArraySchema,
      description: "Contacts that are fully available for the selected time window.",
    },
    partlyBusyContacts: {
      schema: UnknownArraySchema,
      description: "Contacts that have both busy and available time in the selected window.",
    },
    busyContacts: {
      schema: UnknownArraySchema,
      description: "Contacts with no open slots in the selected time window.",
    },
  },
  render: {
    renderer: "calendar",
    defaultLayout: { size: "medium", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedEvent: "Event selection buttons",
      selectedReminder: "Reminder selection buttons",
      selectedDay: "Date selector",
      selectedTimeWindow: "Time range selector",
      availableContacts: "Availability check results",
      partlyBusyContacts: "Availability check results",
      busyContacts: "Availability check results",
    },
  },
  toolCandidates: [
    {
      capabilityId: "calendar.list",
      inputPort: "events",
      resultPath: "$.events",
      purpose: "Render upcoming events from the backend.",
    },
    {
      capabilityId: "calendar.create",
      inputPort: "event",
      resultPath: "$",
      purpose: "Render an event created by the backend.",
    },
    {
      capabilityId: "calendar.list_reminders",
      inputPort: "reminders",
      resultPath: "$.reminders",
      purpose: "Render reminders from the backend.",
    },
  ],
  toolActions: {
    createEvent: {
      capabilityId: "calendar.create",
      refreshBindings: ["events"],
    },
    createReminder: {
      capabilityId: "calendar.create_reminder",
      refreshBindings: ["reminders"],
    },
    checkAvailability: {
      capabilityId: "calendar.availability",
    },
  },
};
