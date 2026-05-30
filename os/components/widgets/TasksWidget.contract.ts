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
    defaultLayout: { size: "medium", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedTask: "Task selection buttons",
      status: "Status filter buttons",
    },
  },
  toolCandidates: [
    {
      capabilityId: "tasks.list",
      inputPort: "tasks",
      resultPath: "$.tasks",
      purpose: "Render task records from the backend.",
    },
    {
      capabilityId: "tasks.create",
      inputPort: "task",
      resultPath: "$",
      purpose: "Render a task created by the backend.",
    },
    {
      capabilityId: "tasks.get",
      inputPort: "task",
      resultPath: "$",
      purpose: "Render one task from the backend.",
    },
  ],
  toolActions: {
    updateTask: {
      capabilityId: "tasks.update",
      refreshBindings: ["tasks"],
    },
    createTask: {
      capabilityId: "tasks.create",
      refreshBindings: ["tasks"],
    },
  },
};
