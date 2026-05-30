"use client";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";

export function ToolResultWidget({ input, emitOutput }: WidgetComponentProps) {
  const value = input.value ?? input;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => emitOutput("value", value)}
        >
          Emit value
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
