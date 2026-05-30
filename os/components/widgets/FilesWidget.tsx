"use client";

import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  formatBytes,
  getArray,
  getString,
  isRecord,
  WidgetBadges,
  WidgetItem,
  WidgetMeta,
} from "@/components/widgets/widget-utils";

export function FilesWidget({ input, emitOutput }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const files = asRecords(result.files).length
    ? asRecords(result.files)
    : isRecord(result.file)
      ? [result.file]
      : isRecord(input.file)
        ? [input.file]
        : [];

  if (files.length === 0) {
    return (
      <EmptyWidget icon={<FileText className="h-4 w-4" aria-hidden />}>
        No files yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <WidgetItem
          key={getString(file, "id") ?? `file:${index}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="break-words text-sm font-medium">
                {getString(file, "name") ?? `File ${index + 1}`}
              </div>
              <WidgetMeta
                items={[
                  getString(file, "mime_type"),
                  formatBytes(file.size_bytes),
                  getString(file, "url"),
                ]}
              />
              <WidgetBadges items={getArray(file, "labels")} />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => emitOutput("selectedFile", file)}
            >
              Select
            </Button>
          </div>
        </WidgetItem>
      ))}
    </div>
  );
}
