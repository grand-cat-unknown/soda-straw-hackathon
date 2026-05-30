"use client";

import { useEffect, useRef } from "react";

import { WorkspaceRenderer } from "@/components/widgets/WorkspaceRenderer";
import { useCanvasState } from "@/lib/workspace";

export function CanvasHost({
  debug = false,
  locked = false,
}: {
  debug?: boolean;
  locked?: boolean;
}) {
  const canvas = useCanvasState();
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    if (locked) {
      workspace.setAttribute("inert", "");
    } else {
      workspace.removeAttribute("inert");
    }
  }, [locked]);

  if (Object.keys(canvas.nodes).length === 0) {
    return null;
  }

  return (
    <div className="relative" aria-busy={locked}>
      <div
        ref={workspaceRef}
        className={`transition duration-200 ${
          locked ? "pointer-events-none select-none opacity-45" : "opacity-100"
        }`}
      >
        <WorkspaceRenderer debug={debug} />
      </div>
      {locked ? (
        <div
          aria-hidden
          className="absolute inset-0 z-30 cursor-wait rounded-md bg-background/20"
        />
      ) : null}
    </div>
  );
}
