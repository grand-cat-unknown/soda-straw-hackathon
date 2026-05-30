"use client";

import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  getArray,
  getString,
  isRecord,
  WidgetBadges,
  WidgetItem,
  WidgetMeta,
} from "@/components/widgets/widget-utils";

export function ContactsWidget({ input, emitOutput }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : input;
  const contacts = asRecords(result.contacts).length
    ? asRecords(result.contacts)
    : isRecord(result.contact)
      ? [result.contact]
      : isRecord(input.contact)
        ? [input.contact]
        : [];
  const groups = asRecords(result.groups).length
    ? asRecords(result.groups)
    : isRecord(result.group)
      ? [result.group]
      : isRecord(input.group)
        ? [input.group]
        : [];

  if (contacts.length === 0 && groups.length === 0) {
    return (
      <EmptyWidget icon={<Users className="h-4 w-4" aria-hidden />}>
        No contacts yet.
      </EmptyWidget>
    );
  }

  return (
    <div className="space-y-4">
      {contacts.length > 0 ? (
        <section className="space-y-2">
          {contacts.map((contact, index) => (
            <WidgetItem
              key={getString(contact, "id") ?? `contact:${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="break-words text-sm font-medium">
                    {getString(contact, "name") ?? `Contact ${index + 1}`}
                  </div>
                  <WidgetMeta
                    items={[
                      getString(contact, "relationship"),
                      getString(contact, "city"),
                      getString(contact, "email"),
                    ]}
                  />
                  <WidgetBadges items={getArray(contact, "tags")} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => emitOutput("selectedContact", contact)}
                >
                  Select
                </Button>
              </div>
            </WidgetItem>
          ))}
        </section>
      ) : null}

      {groups.length > 0 ? (
        <section className="space-y-2">
          <div className="text-sm font-medium">Groups</div>
          {groups.map((group, index) => (
            <WidgetItem
              key={getString(group, "id") ?? `group:${index}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words text-sm font-medium">
                    {getString(group, "name") ?? `Group ${index + 1}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getArray(group, "person_ids").length} people
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => emitOutput("selectedGroup", group)}
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
