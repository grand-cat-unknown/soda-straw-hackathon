"use client";

import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  compactJson,
  EmptyWidget,
  formatBytes,
  getArray,
  getString,
  isRecord,
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
        <div
          key={getString(file, "id") ?? `file:${index}`}
          className="rounded-md border border-border p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="break-words text-sm font-medium">
                {getString(file, "name") ?? `File ${index + 1}`}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {getString(file, "mime_type") ? <span>{getString(file, "mime_type")}</span> : null}
                {formatBytes(file.size_bytes) ? <span>{formatBytes(file.size_bytes)}</span> : null}
                {getString(file, "url") ? <span className="break-all">{getString(file, "url")}</span> : null}
              </div>
              {getArray(file, "labels").length ? (
                <div className="flex flex-wrap gap-1">
                  {getArray(file, "labels").map((label) => (
                    <span
                      key={compactJson(label)}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {compactJson(label)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => emitOutput("selectedFile", file)}
            >
              Select
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
