import {
  AnySchema,
  StringSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const TasksWidgetContract: WidgetContract = {
  type: "tasks",
  title: "Tasks",
  description: "Renders task lists and individual task records.",
  inputs: {
    tasks: {
      schema: UnknownArraySchema,
      description: "Task records from tasks.list.",
      optional: true,
    },
    task: {
      schema: UnknownRecordSchema,
      description: "Single task from tasks.create, tasks.get, or tasks.update.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw tasks capability result.",
      optional: true,
    },
  },
  outputs: {
    selectedTask: {
      schema: UnknownRecordSchema,
      description: "Task selected by the user.",
    },
    status: {
      schema: StringSchema,
      description: "Status value selected or summarized from tasks.",
    },
  },
  render: {
    renderer: "tasks",
    defaultLayout: { x: 0, y: 0, w: 50, h: 5 },
    minLayout: { w: 33, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedTask: "Task selection buttons",
      status: "Status filter buttons",
    },
  },
};
