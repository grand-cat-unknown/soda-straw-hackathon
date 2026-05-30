"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prettyToolName, type ToolCallTrace } from "@/lib/workspace";

export function ToolTrace({ traces }: { traces: ToolCallTrace[] }) {
  if (traces.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tool calls ({traces.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {traces.map((trace) => (
          <TraceRow key={trace.id} trace={trace} />
        ))}
      </CardContent>
    </Card>
  );
}

function TraceRow({ trace }: { trace: ToolCallTrace }) {
  const [open, setOpen] = useState(false);
  const failed = Boolean(trace.error);

  return (
    <div className="rounded border border-border bg-muted/30">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between rounded-none px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden
          />
          <code className="text-xs">{prettyToolName(trace.name)}</code>
        </span>
        <Badge
          variant={failed ? "outline" : "secondary"}
          className={failed ? "text-destructive" : ""}
        >
          {failed ? "error" : "ok"}
        </Badge>
      </Button>
      {open ? (
        <div className="space-y-2 border-t border-border px-3 py-2 text-xs">
          <div>
            <div className="mb-1 font-medium">arguments</div>
            <pre className="overflow-x-auto rounded bg-background p-2">
              {JSON.stringify(trace.arguments, null, 2)}
            </pre>
          </div>
          <div>
            <div className="mb-1 font-medium">{failed ? "error" : "output"}</div>
            <pre className="overflow-x-auto rounded bg-background p-2">
              {failed
                ? trace.error
                : JSON.stringify(trace.output, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
