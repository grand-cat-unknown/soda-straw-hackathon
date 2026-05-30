"use client";

import { ExternalLink, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  getNumber,
  getString,
  isRecord,
  WidgetItem,
  WidgetMeta,
} from "@/components/widgets/widget-utils";

export function SearchWidget({ input, emitOutput }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const query = getString(result, "query") ?? getString(input, "query");
  const results = asRecords(result.results).length
    ? asRecords(result.results)
    : asRecords(input.results);

  if (results.length === 0) {
    return (
      <EmptyWidget icon={<Search className="h-4 w-4" aria-hidden />}>
        No search results yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-3">
      {query ? (
        <div className="text-sm text-muted-foreground">
          Results for <span className="font-medium text-foreground">{query}</span>
        </div>
      ) : null}
      <div className="space-y-2">
        {results.map((item, index) => {
          const url = getString(item, "url");
          return (
            <WidgetItem
              key={url ?? getString(item, "title") ?? `result:${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="break-words text-sm font-medium">
                    {getString(item, "title") ?? `Result ${index + 1}`}
                  </div>
                  <WidgetMeta
                    items={[
                      getString(item, "source"),
                      getString(item, "published_date"),
                      getNumber(item, "score") !== undefined
                        ? `Score ${getNumber(item, "score")?.toFixed(3)}`
                        : undefined,
                    ]}
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  {url ? (
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Use URL"
                      title="Use URL"
                      onClick={() => emitOutput("url", url)}
                    >
                      <ExternalLink aria-hidden />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => emitOutput("selectedResult", item)}
                  >
                    Select
                  </Button>
                </div>
              </div>
              {getString(item, "snippet") ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {getString(item, "snippet")}
                </p>
              ) : null}
              {url ? (
                <div className="mt-2 break-all font-mono text-xs text-muted-foreground">
                  {url}
                </div>
              ) : null}
            </WidgetItem>
          );
        })}
      </div>
    </div>
  );
}
