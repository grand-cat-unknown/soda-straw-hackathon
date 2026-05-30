"use client";

import { WorkspaceRenderer } from "@/components/widgets/WorkspaceRenderer";
import { useCanvasState } from "@/lib/workspace";

export function CanvasHost({ debug = false }: { debug?: boolean }) {
  const canvas = useCanvasState();

  if (Object.keys(canvas.nodes).length === 0) {
    return null;
  }

  return <WorkspaceRenderer debug={debug} />;
}
