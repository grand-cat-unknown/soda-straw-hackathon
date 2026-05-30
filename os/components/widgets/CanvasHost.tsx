"use client";

import { WorkspaceRenderer } from "@/components/widgets/WorkspaceRenderer";
import type { Workspace } from "@/lib/workspace";

export function CanvasHost({ workspace }: { workspace: Workspace }) {
  if (workspace.graph.nodes.length === 0) {
    return null;
  }

  return <WorkspaceRenderer graph={workspace.graph} />;
}
