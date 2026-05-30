import { widgetRegistryFromContracts } from "@/lib/workspace/contracts";
import type { WidgetDefinition, WidgetType } from "@/lib/workspace/types";

export const widgetRegistry: Record<WidgetType, WidgetDefinition> =
  widgetRegistryFromContracts;
