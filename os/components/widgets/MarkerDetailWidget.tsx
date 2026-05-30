"use client";

import { MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Place, WidgetComponentProps } from "@/lib/workspace";

export function MarkerDetailWidget({ input, emitOutput }: WidgetComponentProps) {
  const marker = input.marker as Place | null | undefined;

  if (!marker) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPinned className="h-4 w-4" aria-hidden />
        Select a marker on the map.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-medium">{marker.label ?? marker.id}</div>
          <div className="text-muted-foreground">
            {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => emitOutput("marker", marker)}
        >
          Use marker
        </Button>
      </div>
    </div>
  );
}
