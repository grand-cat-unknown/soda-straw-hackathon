import {
  buildWorkspaceCanvases,
  buildWorkspaceGraph,
  buildWorkspaceTables,
} from "@/lib/workspace/trace-adapters";
import type { ToolCallTrace, Workspace } from "@/lib/workspace/types";

export * from "@/lib/workspace/registry";
export * from "@/lib/workspace/bridges";
export * from "@/lib/workspace/contracts";
export * from "@/lib/workspace/runtime";
export * from "@/lib/workspace/schemas";
export * from "@/lib/workspace/store";
export * from "@/lib/workspace/trace-adapters";
export * from "@/lib/workspace/transforms";
export * from "@/lib/workspace/types";

export function buildWorkspace(traces: ToolCallTrace[]): Workspace {
  return {
    tables: buildWorkspaceTables(traces),
    canvases: buildWorkspaceCanvases(traces),
    graph: buildWorkspaceGraph(traces),
  };
}
