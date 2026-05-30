"use client";

import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { CalculatorWidget } from "@/components/widgets/CalculatorWidget";
import { ContactsWidget } from "@/components/widgets/ContactsWidget";
import { FilesWidget } from "@/components/widgets/FilesWidget";
import { FormsWidget } from "@/components/widgets/FormsWidget";
import { MapCanvasWidget } from "@/components/widgets/MapWidget";
import { MarkerDetailWidget } from "@/components/widgets/MarkerDetailWidget";
import { MessagesWidget } from "@/components/widgets/MessagesWidget";
import { NotesWidget } from "@/components/widgets/NotesWidget";
import { SearchWidget } from "@/components/widgets/SearchWidget";
import { TableCanvasWidget } from "@/components/widgets/TableWidget";
import { TasksWidget } from "@/components/widgets/TasksWidget";
import { ToolResultWidget } from "@/components/widgets/ToolResultWidget";
import type { ReactNode } from "react";
import type {
  WidgetComponentProps,
  WidgetType,
} from "@/lib/workspace/types";

export const widgetRenderers: Record<
  WidgetType,
  (props: WidgetComponentProps) => ReactNode
> = {
  calculator: CalculatorWidget,
  calendar: CalendarWidget,
  contacts: ContactsWidget,
  files: FilesWidget,
  forms: FormsWidget,
  messages: MessagesWidget,
  notes: NotesWidget,
  search: SearchWidget,
  tasks: TasksWidget,
  table: TableCanvasWidget,
  map: MapCanvasWidget,
  "marker-detail": MarkerDetailWidget,
  "tool-result": ToolResultWidget,
};

export const fallbackWidgetRenderer = ToolResultWidget;
