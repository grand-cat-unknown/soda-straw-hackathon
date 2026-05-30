import {
  AnySchema,
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
  },
  render: {
    renderer: "calendar",
    defaultLayout: { size: "medium", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedEvent: "Event selection buttons",
      selectedReminder: "Reminder selection buttons",
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
  },
};
