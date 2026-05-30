"use client";

import { Check, Loader2, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { prettyToolName, type PendingCall, type ToolCallTrace } from "@/lib/workspace";

type Activity =
  | { kind: "pending"; id: string; name: string }
  | { kind: "done"; id: string; name: string; failed: boolean };

export function ActivityTicker({
  pending,
  traces,
  isStreaming,
}: {
  pending: PendingCall[];
  traces: ToolCallTrace[];
  isStreaming: boolean;
}) {
  if (!isStreaming && traces.length === 0 && pending.length === 0) return null;

  const items: Activity[] = [
    ...traces.map<Activity>((t) => ({
      kind: "done",
      id: t.id,
      name: t.name,
      failed: Boolean(t.error),
    })),
    ...pending.map<Activity>((p) => ({
      kind: "pending",
      id: p.id,
      name: p.name,
    })),
  ];

  return (
    <Card className="fluid-enter">
      <CardContent className="p-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          {isStreaming ? (
            <>
              <span className="fluid-dot inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
              <span className="fluid-dot delay-1 inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
              <span className="fluid-dot delay-2 inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
              <span className="ml-1">assembling workspace</span>
            </>
          ) : (
            <span>{traces.length} step{traces.length === 1 ? "" : "s"}</span>
          )}
        </div>
        <ul className="space-y-1">
          {items.length === 0 ? (
            <li className="text-xs text-muted-foreground">Thinking…</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                {item.kind === "pending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : item.failed ? (
                  <X className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-foreground" />
                )}
                <code className="text-xs">{prettyToolName(item.name)}</code>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
