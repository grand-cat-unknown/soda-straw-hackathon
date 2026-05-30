import { CalendarWidgetContract } from "@/components/widgets/CalendarWidget.contract";
import { CalculatorWidgetContract } from "@/components/widgets/CalculatorWidget.contract";
import { ContactsWidgetContract } from "@/components/widgets/ContactsWidget.contract";
import { FilesWidgetContract } from "@/components/widgets/FilesWidget.contract";
import { FormsWidgetContract } from "@/components/widgets/FormsWidget.contract";
import { MapWidgetContract } from "@/components/widgets/MapWidget.contract";
import { MarkerDetailWidgetContract } from "@/components/widgets/MarkerDetailWidget.contract";
import { MessagesWidgetContract } from "@/components/widgets/MessagesWidget.contract";
import { NotesWidgetContract } from "@/components/widgets/NotesWidget.contract";
import { SearchWidgetContract } from "@/components/widgets/SearchWidget.contract";
import { TableWidgetContract } from "@/components/widgets/TableWidget.contract";
import { TasksWidgetContract } from "@/components/widgets/TasksWidget.contract";
import { ToolResultWidgetContract } from "@/components/widgets/ToolResultWidget.contract";
import type {
  WidgetContract,
  WidgetDefinition,
  WidgetType,
} from "@/lib/workspace/types";

export const widgetContracts: Record<WidgetType, WidgetContract> =
  Object.fromEntries(
    [
      CalculatorWidgetContract,
      CalendarWidgetContract,
      ContactsWidgetContract,
      FilesWidgetContract,
      FormsWidgetContract,
      MessagesWidgetContract,
      NotesWidgetContract,
      SearchWidgetContract,
      TasksWidgetContract,
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

export function widgetCatalogForPrompt(): string {
  const lines = Object.values(widgetContracts).map((contract) => {
    const inputs = Object.entries(contract.inputs)
      .map(([name, port]) => {
        const flag = port.optional ? "?" : "";
        return `input.${name}${flag} (${port.description})`;
      })
      .join(", ");
    const outputs = Object.entries(contract.outputs)
      .map(([name, port]) => `${name} (${port.description})`)
      .join(", ");
    return `- '${contract.type}': ${contract.description} Inputs: ${inputs || "none"}. Outputs: ${outputs || "none"}.`;
  });
  return ["Available widget types (from live contracts):", ...lines].join("\n");
}
