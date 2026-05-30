"use client";

import { ArrowRight, ListChecks } from "lucide-react";

import type { CanvasPlan } from "@/lib/workspace/types";

export function PlanCard({ plan }: { plan: CanvasPlan }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 text-sm">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <ListChecks className="h-3.5 w-3.5" aria-hidden />
        Plan
      </div>
      {plan.intent ? (
        <p className="mb-3 text-sm text-foreground">{plan.intent}</p>
      ) : null}

      {plan.widgets.length > 0 ? (
        <div className="mb-3">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Widgets
          </div>
          <ul className="space-y-1.5">
            {plan.widgets.map((widget) => (
              <li
                key={widget.id}
                className="flex items-baseline gap-2 text-xs text-foreground"
              >
                <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {widget.type}
                </span>
                <span className="font-medium">{widget.title}</span>
                <span className="text-muted-foreground">— {widget.rationale}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.bridges.length > 0 ? (
        <div className="mb-1">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Bridges
          </div>
          <ul className="space-y-1.5">
            {plan.bridges.map((bridge, i) => (
              <li
                key={`${bridge.from.nodeId}.${bridge.from.port}->${bridge.to.nodeId}.${bridge.to.port}.${i}`}
                className="flex flex-wrap items-center gap-1.5 text-xs text-foreground"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {bridge.from.nodeId}.{bridge.from.port}
                </span>
                <ArrowRight className="h-3 w-3" aria-hidden />
                <span className="font-mono text-[11px] text-muted-foreground">
                  {bridge.to.nodeId}.{bridge.to.port}
                </span>
                <span className="text-muted-foreground">— {bridge.rationale}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.notes ? (
        <p className="mt-2 text-xs text-muted-foreground">{plan.notes}</p>
      ) : null}
    </div>
  );
}
