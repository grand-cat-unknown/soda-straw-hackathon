"use client";

import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  compactJson,
  EmptyWidget,
  formatDateTime,
  getArray,
  getString,
  isRecord,
  WidgetBadges,
  WidgetItem,
} from "@/components/widgets/widget-utils";

export function FormsWidget({ input, emitOutput }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const forms = asRecords(result.forms).length
    ? asRecords(result.forms)
    : isRecord(result.form)
      ? [result.form]
      : isRecord(input.form)
        ? [input.form]
        : [];
  const responses = asRecords(result.responses).length
    ? asRecords(result.responses)
    : isRecord(result.response)
      ? [result.response]
      : isRecord(input.response)
        ? [input.response]
        : [];

  if (forms.length === 0 && responses.length === 0) {
    return (
      <EmptyWidget icon={<ClipboardList className="h-4 w-4" aria-hidden />}>
        No forms yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-4">
      {forms.length > 0 ? (
        <section className="space-y-2">
          {forms.map((form, index) => (
            <WidgetItem
              key={getString(form, "id") ?? `form:${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="break-words text-sm font-medium">
                    {getString(form, "title") ?? `Form ${index + 1}`}
                  </div>
                  <WidgetBadges
                    items={asRecords(getArray(form, "fields")).map(
                      (field) => getString(field, "name") ?? compactJson(field),
                    )}
                  />
                  {getString(form, "share_url") ? (
                    <div className="break-all font-mono text-xs text-muted-foreground">
                      {getString(form, "share_url")}
                    </div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => emitOutput("selectedForm", form)}
                >
                  Select
                </Button>
              </div>
            </WidgetItem>
          ))}
        </section>
      ) : null}

      {responses.length > 0 ? (
        <section className="space-y-2">
          <div className="text-sm font-medium">Responses</div>
          {responses.map((response, index) => (
            <WidgetItem
              key={getString(response, "id") ?? `response:${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="text-sm font-medium">
                    {getString(response, "id") ?? `Response ${index + 1}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(getString(response, "submitted_at"))}
                  </div>
                  {isRecord(response.values) ? (
                    <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      {Object.entries(response.values).map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="font-medium text-foreground">{key}</dt>
                          <dd className="truncate">{compactJson(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => emitOutput("selectedResponse", response)}
                >
                  Select
                </Button>
              </div>
            </WidgetItem>
          ))}
        </section>
      ) : null}
    </div>
  );
}
