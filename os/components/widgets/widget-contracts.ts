import { CanvasSummaryWidgetContract } from "@/components/widgets/CanvasSummaryWidget.contract";
import { MapWidgetContract } from "@/components/widgets/MapWidget.contract";
import { MarkerDetailWidgetContract } from "@/components/widgets/MarkerDetailWidget.contract";
import { TableWidgetContract } from "@/components/widgets/TableWidget.contract";
import { ToolResultWidgetContract } from "@/components/widgets/ToolResultWidget.contract";
import type {
  WidgetContract,
  WidgetDefinition,
  WidgetType,
} from "@/lib/workspace/types";

export const widgetContracts: Record<WidgetType, WidgetContract> =
  Object.fromEntries(
    [
      CanvasSummaryWidgetContract,
      TableWidgetContract,
      MapWidgetContract,
      MarkerDetailWidgetContract,
      ToolResultWidgetContract,
    ].map((contract) => [contract.type, contract]),
  );

export function getWidgetContract(type: WidgetType): WidgetContract | undefined {
  return widgetContracts[type];
}

export function contractToDefinition(contract: WidgetContract): WidgetDefinition {
  return {
    type: contract.type,
    title: contract.title,
    description: contract.description,
    inputs: Object.entries(contract.inputs).map(([name, port]) => ({
      name,
      description: port.description,
    })),
    outputs: Object.entries(contract.outputs).map(([name, port]) => ({
      name,
      description: port.description,
    })),
    render: contract.render,
  };
}

export const widgetRegistryFromContracts: Record<WidgetType, WidgetDefinition> =
  Object.fromEntries(
    Object.values(widgetContracts).map((contract) => [
      contract.type,
      contractToDefinition(contract),
    ]),
  );
