"use client";

import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  compactJson,
  EmptyWidget,
  getArray,
  getString,
  isRecord,
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
            <div
              key={getString(contact, "id") ?? `contact:${index}`}
              className="rounded-md border border-border p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="break-words text-sm font-medium">
                    {getString(contact, "name") ?? `Contact ${index + 1}`}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {getString(contact, "relationship") ? <span>{getString(contact, "relationship")}</span> : null}
                    {getString(contact, "city") ? <span>{getString(contact, "city")}</span> : null}
                    {getString(contact, "email") ? <span>{getString(contact, "email")}</span> : null}
                  </div>
                  {getArray(contact, "tags").length ? (
                    <div className="flex flex-wrap gap-1">
                      {getArray(contact, "tags").map((tag) => (
                        <span
                          key={compactJson(tag)}
                          className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {compactJson(tag)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => emitOutput("selectedContact", contact)}
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {groups.length > 0 ? (
        <section className="space-y-2">
          <div className="text-sm font-medium">Groups</div>
          {groups.map((group, index) => (
            <div
              key={getString(group, "id") ?? `group:${index}`}
              className="rounded-md border border-border p-3"
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
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
