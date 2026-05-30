"use client";

import { CanvasSummaryWidget } from "@/components/widgets/CanvasSummaryWidget";
import { MapCanvasWidget } from "@/components/widgets/MapWidget";
import { MarkerDetailWidget } from "@/components/widgets/MarkerDetailWidget";
import { TableCanvasWidget } from "@/components/widgets/TableWidget";
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
  "canvas-summary": CanvasSummaryWidget,
  table: TableCanvasWidget,
  map: MapCanvasWidget,
  "marker-detail": MarkerDetailWidget,
  "tool-result": ToolResultWidget,
};

export const fallbackWidgetRenderer = ToolResultWidget;
