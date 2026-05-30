"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { applyGraphTransform } from "@/lib/workspace/transforms";
import type { WidgetInput, WorkspaceGraph } from "@/lib/workspace/types";

type InputState = Record<string, WidgetInput>;

function initialInputs(graph: WorkspaceGraph): InputState {
  return Object.fromEntries(graph.nodes.map((node) => [node.id, node.input]));
}

export function useWorkspaceRuntime(graph: WorkspaceGraph) {
  const graphKey = useMemo(() => JSON.stringify(graph), [graph]);
  const [inputs, setInputs] = useState<InputState>(() => initialInputs(graph));

  useEffect(() => {
    setInputs(initialInputs(graph));
  }, [graphKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const emitOutput = useCallback(
    (nodeId: string, port: string, value: unknown) => {
      const outgoing = graph.edges.filter(
        (edge) => edge.from.nodeId === nodeId && edge.from.port === port,
      );
      if (outgoing.length === 0) return;

      setInputs((current) => {
        const next = { ...current };
        for (const edge of outgoing) {
          next[edge.to.nodeId] = {
            ...(next[edge.to.nodeId] ?? {}),
            [edge.to.port]: applyGraphTransform(edge.transform, value),
          };
        }
        return next;
      });
    },
    [graph],
  );

  return { inputs, emitOutput };
}
