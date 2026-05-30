"use client";

import { FileText, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  formatBytes,
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
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {files.map((file, index) => {
        const name = getString(file, "name") ?? `File ${index + 1}`;
        const mime = getString(file, "mime_type");
        const size = formatBytes(file.size_bytes);
        return (
          <li
            key={getString(file, "id") ?? `file:${index}`}
            className="group flex items-center gap-2 px-2 py-1.5 text-sm"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="truncate font-medium">{name}</span>
              {(mime || size) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {[mime, size].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Use file"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => emitOutput("selectedFile", file)}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
