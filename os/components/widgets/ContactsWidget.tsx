"use client";

import { useState } from "react";
import { Check, Pencil, Send, Trash2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/lib/workspace";
import {
  asRecords,
  EmptyWidget,
  getArray,
  getString,
  isRecord,
  WidgetBadges,
} from "@/components/widgets/widget-utils";

export function ContactsWidget({ input, emitOutput, node, runAction }: WidgetComponentProps) {
  const result = isRecord(input.result) ? input.result : {};
  const contacts = filterContactsByTags(
    pick(asRecords(input.contacts), asRecords(result.contacts), input.contact, result.contact),
    tagsFromInput(input),
  );
  const groups = pick(asRecords(input.groups), asRecords(result.groups), input.group, result.group);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; email: string; city: string }>({
    name: "",
    email: "",
    city: "",
  });

  if (contacts.length === 0 && groups.length === 0) {
    return (
      <EmptyWidget icon={<Users className="h-4 w-4" aria-hidden />}>
        No contacts yet.
      </EmptyWidget>
    );
  }

  const canUpdate = Boolean(node.actions?.updateContact);
  const canDelete = Boolean(node.actions?.deleteContact);
  const canDeleteGroup = Boolean(node.actions?.deleteGroup);

  return (
    <div className="space-y-3">
      {contacts.length > 0 ? (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {contacts.map((contact, index) => {
            const contactId = getString(contact, "id");
            const name = getString(contact, "name") ?? `Contact ${index + 1}`;
            const relationship = getString(contact, "relationship");
            const city = getString(contact, "city");
            const email = getString(contact, "email");
            const isEditing = editingId !== null && contactId === editingId;
            const tags = getArray(contact, "tags");

            return (
              <li key={contactId ?? `contact:${index}`} className="group px-2 py-1.5 text-sm">
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      autoFocus
                      placeholder="Name"
                      value={draft.name}
                      onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full rounded border border-input bg-background px-2 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <div className="flex gap-1">
                      <input
                        placeholder="Email"
                        value={draft.email}
                        onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
                        className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <input
                        placeholder="City"
                        value={draft.city}
                        onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
                        className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button type="button" size="xs" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          if (contactId) {
                            void runAction("updateContact", {
                              contact_id: contactId,
                              name: draft.name,
                              email: draft.email,
                              city: draft.city,
                            });
                          }
                          setEditingId(null);
                        }}
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{name}</span>
                        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                          {[relationship, city, email].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                      {tags.length > 0 ? (
                        <div className="mt-0.5">
                          <WidgetBadges items={tags} />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      {canUpdate && contactId ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Edit contact"
                          onClick={() => {
                            setEditingId(contactId);
                            setDraft({
                              name,
                              email: email ?? "",
                              city: city ?? "",
                            });
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Select contact"
                        onClick={() => emitOutput("selectedContact", contact)}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                      {canDelete && contactId ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Delete contact"
                          onClick={() => void runAction("deleteContact", { contact_id: contactId })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {groups.length > 0 ? (
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Groups</div>
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {groups.map((group, index) => {
              const groupId = getString(group, "id");
              const name = getString(group, "name") ?? `Group ${index + 1}`;
              const people = getArray(group, "person_ids").length;
              return (
                <li key={groupId ?? `group:${index}`} className="group flex items-center gap-2 px-2 py-1.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium">{name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{people} people</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Select group"
                      onClick={() => emitOutput("selectedGroup", group)}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    {canDeleteGroup && groupId ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete group"
                        onClick={() => void runAction("deleteGroup", { group_id: groupId })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function pick(
  inputArr: Record<string, unknown>[],
  resultArr: Record<string, unknown>[],
  inputSingle: unknown,
  resultSingle: unknown,
): Record<string, unknown>[] {
  if (inputArr.length) return inputArr;
  if (resultArr.length) return resultArr;
  if (isRecord(inputSingle)) return [inputSingle];
  if (isRecord(resultSingle)) return [resultSingle];
  return [];
}

function normalizeTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function tagsFromInput(input: Record<string, unknown>): string[] {
  const directTag = normalizeTag(input.tag);
  const tagList = getArray(input, "tags")
    .map(normalizeTag)
    .filter((tag): tag is string => tag !== null);
  return directTag ? [directTag, ...tagList] : tagList;
}

function filterContactsByTags(
  contacts: Record<string, unknown>[],
  tags: string[],
): Record<string, unknown>[] {
  if (tags.length === 0) return contacts;
  const requestedTags = new Set(tags);
  return contacts.filter((contact) =>
    getArray(contact, "tags")
      .map(normalizeTag)
      .some((tag) => tag !== null && requestedTags.has(tag)),
  );
}
