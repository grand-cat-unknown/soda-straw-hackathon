import { getWidgetContract } from "@/lib/workspace/contracts";
import type {
  ToolAction,
  ToolBinding,
  ToolBindingRefresh,
  WidgetToolCandidate,
} from "@/lib/workspace/types";

type RawBinding = ToolBinding & {
  capability_id?: string;
  result_path?: string;
};

type RawAction = ToolAction & {
  capability_id?: string;
  input_map?: Record<string, string>;
  refresh_bindings?: string[];
};

export function bindingCapabilityId(binding: ToolBinding): string | undefined {
  return (
    (binding as RawBinding).capabilityId ??
    (binding as RawBinding).capability_id
  );
}

export function bindingResultPath(
  type: string,
  name: string,
  binding: ToolBinding,
): string | undefined {
  return (
    (binding as RawBinding).resultPath ??
    (binding as RawBinding).result_path ??
    findToolCandidate(type, name, binding)?.resultPath
  );
}

export function actionCapabilityId(action: ToolAction): string | undefined {
  return (
    (action as RawAction).capabilityId ??
    (action as RawAction).capability_id
  );
}

export function actionRefreshBindings(action: ToolAction): string[] {
  return action.refreshBindings ?? (action as RawAction).refresh_bindings ?? [];
}

export function isPrimaryDataCandidate(candidate: WidgetToolCandidate): boolean {
  const operation = candidate.capabilityId.split(".").at(-1) ?? "";
  return /^(list|search)/.test(operation);
}

export function findToolCandidate(
  type: string,
  inputPort: string,
  binding?: ToolBinding,
): WidgetToolCandidate | undefined {
  const capabilityId = binding ? bindingCapabilityId(binding) : undefined;
  return getWidgetContract(type)?.toolCandidates?.find(
    (candidate) =>
      candidate.inputPort === inputPort &&
      (!capabilityId || candidate.capabilityId === capabilityId),
  );
}

function normalizeRefresh(value: unknown): ToolBindingRefresh | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  switch (normalized) {
    case "onmount":
      return "onMount";
    case "afteraction":
      return "afterAction";
    case "manual":
      return "manual";
    default:
      return undefined;
  }
}

function normalizeBinding(
  type: string,
  name: string,
  binding: ToolBinding,
): ToolBinding {
  const candidate = findToolCandidate(type, name, binding);
  const capabilityId = bindingCapabilityId(binding) ?? candidate?.capabilityId;
  const resultPath = bindingResultPath(type, name, binding) ?? candidate?.resultPath;
  const refresh = normalizeRefresh(binding.refresh);
  const shouldLoadOnMount =
    candidate && isPrimaryDataCandidate(candidate)
      ? true
      : refresh === "onMount" || refresh === undefined;

  return {
    ...binding,
    ...(capabilityId ? { capabilityId } : {}),
    ...(resultPath ? { resultPath } : {}),
    ...(binding.transform ?? candidate?.transform
      ? { transform: binding.transform ?? candidate?.transform }
      : {}),
    refresh: shouldLoadOnMount ? "onMount" : refresh,
  };
}

export function normalizeWidgetBindings(
  type: string,
  bindings?: Record<string, ToolBinding>,
): Record<string, ToolBinding> | undefined {
  const contract = getWidgetContract(type);
  const normalized: Record<string, ToolBinding> = {};

  for (const [name, binding] of Object.entries(bindings ?? {})) {
    normalized[name] = normalizeBinding(type, name, binding);
  }

  for (const candidate of contract?.toolCandidates ?? []) {
    if (normalized[candidate.inputPort]) continue;
    if (!isPrimaryDataCandidate(candidate)) continue;
    normalized[candidate.inputPort] = {
      capabilityId: candidate.capabilityId,
      resultPath: candidate.resultPath,
      ...(candidate.transform ? { transform: candidate.transform } : {}),
      refresh: "onMount",
    };
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function normalizeWidgetActions(
  actions?: Record<string, ToolAction>,
): Record<string, ToolAction> | undefined {
  if (!actions) return undefined;

  const normalized = Object.fromEntries(
    Object.entries(actions).map(([name, action]) => {
      const capabilityId = actionCapabilityId(action);
      const refreshBindings = actionRefreshBindings(action);
      return [
        name,
        {
          ...action,
          ...(capabilityId ? { capabilityId } : {}),
          ...((action as RawAction).input_map && !action.inputMap
            ? { inputMap: (action as RawAction).input_map }
            : {}),
          ...(refreshBindings.length > 0 ? { refreshBindings } : {}),
        },
      ];
    }),
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function shouldRefreshBindingOnMount(
  type: string,
  name: string,
  binding: ToolBinding,
): boolean {
  const refresh = normalizeRefresh(binding.refresh);
  const candidate = findToolCandidate(type, name, binding);
  return (
    refresh === undefined ||
    refresh === "onMount" ||
    Boolean(candidate && isPrimaryDataCandidate(candidate))
  );
}
