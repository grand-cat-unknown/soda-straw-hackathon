"use client";

import { MessageSquareText } from "lucide-react";

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
  WidgetItem,
  WidgetMeta,
} from "@/components/widgets/widget-utils";

export function MessagesWidget({ input, emitOutput }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const draft = pickRecord(result, input, "draft", "id", "draft_id");
  const sent = pickRecord(result, input, "sent", "message_id");
  const tracking = pickRecord(result, input, "tracking", "tracking_id");
  const replies = asRecords(result.replies).length
    ? asRecords(result.replies)
    : asRecords(input.replies);

  if (!draft && !sent && !tracking && replies.length === 0) {
    return (
      <EmptyWidget icon={<MessageSquareText className="h-4 w-4" aria-hidden />}>
        No messages yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-3">
      {draft ? (
        <WidgetItem className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="break-words text-sm font-medium">
                {getString(draft, "subject") ?? "Draft message"}
              </div>
              <WidgetMeta
                items={[
                  getString(draft, "channel"),
                  getString(draft, "tone"),
                  getArray(draft, "recipients").length
                    ? getArray(draft, "recipients").map(compactJson).join(", ")
                    : undefined,
                ]}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => emitOutput("draft", draft)}>
              Use draft
            </Button>
          </div>
          {getString(draft, "body") ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {getString(draft, "body")}
            </p>
          ) : null}
        </WidgetItem>
      ) : null}

      {sent ? (
        <StatusCard
          title={getString(sent, "message_id") ?? "Sent message"}
          details={[
            getString(sent, "status"),
            formatDateTime(getString(sent, "sent_at")),
          ]}
          onSelect={() => emitOutput("message", sent)}
        />
      ) : null}

      {tracking ? (
        <StatusCard
          title={getString(tracking, "tracking_id") ?? "Reply tracking"}
          details={[
            getString(tracking, "message_id"),
            `${asRecords(tracking.replies).length} replies`,
          ]}
          onSelect={() => emitOutput("message", tracking)}
        />
      ) : null}

      {replies.length > 0 ? (
        <section className="space-y-2">
          <div className="text-sm font-medium">Replies</div>
          {replies.map((reply, index) => (
            <WidgetItem
              key={getString(reply, "id") ?? `reply:${index}`}
            >
              <pre className="overflow-auto text-xs">{JSON.stringify(reply, null, 2)}</pre>
            </WidgetItem>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function pickRecord(
  result: Record<string, unknown>,
  input: Record<string, unknown>,
  explicitKey: string,
  ...signatureKeys: string[]
): Record<string, unknown> | undefined {
  if (isRecord(input[explicitKey])) return input[explicitKey];
  if (isRecord(result[explicitKey])) return result[explicitKey];
  return signatureKeys.some((key) => key in result) ? result : undefined;
}

function StatusCard({
  title,
  details,
  onSelect,
}: {
  title: string;
  details: (string | undefined)[];
  onSelect: () => void;
}) {
  return (
    <WidgetItem>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="break-words text-sm font-medium">{title}</div>
          <WidgetMeta items={details} />
        </div>
        <Button type="button" variant="outline" onClick={onSelect}>
          Select
        </Button>
      </div>
    </WidgetItem>
  );
}
