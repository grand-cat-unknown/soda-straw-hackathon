"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Trash2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedContactIds, setSelectedContactIds] = useState<Record<string, true>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<Record<string, true>>({});

  const contactKey = (contact: Record<string, unknown>, index: number) =>
    getString(contact, "id") ?? `contact:${index}`;
  const groupKey = (group: Record<string, unknown>, index: number) =>
    getString(group, "id") ?? `group:${index}`;

  const selectedContacts = useMemo(
    () => contacts.filter((contact, index) => selectedContactIds[contactKey(contact, index)]),
    [contacts, selectedContactIds],
  );
  const selectedGroups = useMemo(
    () => groups.filter((group, index) => selectedGroupIds[groupKey(group, index)]),
    [groups, selectedGroupIds],
  );

  function toggleContact(key: string, contact: Record<string, unknown>) {
    const next = { ...selectedContactIds };
    if (next[key]) delete next[key];
    else next[key] = true;
    setSelectedContactIds(next);
    const list = contacts.filter((c, i) => next[contactKey(c, i)]);
    emitOutput("selectedContacts", list);
    if (list.length === 1) emitOutput("selectedContact", list[0]);
    if (next[key]) emitOutput("selectedContact", contact);
  }

  function toggleGroup(key: string, group: Record<string, unknown>) {
    const next = { ...selectedGroupIds };
    if (next[key]) delete next[key];
    else next[key] = true;
    setSelectedGroupIds(next);
    const list = groups.filter((g, i) => next[groupKey(g, i)]);
    emitOutput("selectedGroups", list);
    if (list.length === 1) emitOutput("selectedGroup", list[0]);
    if (next[key]) emitOutput("selectedGroup", group);
  }

  function selectAllContacts() {
    const next: Record<string, true> = Object.fromEntries(
      contacts.map((contact, index) => [contactKey(contact, index), true]),
    );
    setSelectedContactIds(next);
    emitOutput("selectedContacts", contacts);
  }

  function clearContactSelection() {
    setSelectedContactIds({});
    emitOutput("selectedContacts", []);
  }

  function selectAllGroups() {
    const next: Record<string, true> = Object.fromEntries(
      groups.map((group, index) => [groupKey(group, index), true]),
    );
    setSelectedGroupIds(next);
    emitOutput("selectedGroups", groups);
  }

  function clearGroupSelection() {
    setSelectedGroupIds({});
    emitOutput("selectedGroups", []);
  }

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
        <>
          <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
            <span>{selectedContacts.length} selected</span>
            <div className="flex gap-1">
              <Button type="button" size="xs" variant="ghost" onClick={selectAllContacts}>
                Select all
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={clearContactSelection}>
                Clear
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {contacts.map((contact, index) => {
            const contactId = getString(contact, "id");
            const key = contactKey(contact, index);
            const name = getString(contact, "name") ?? `Contact ${index + 1}`;
            const relationship = getString(contact, "relationship");
            const city = getString(contact, "city");
            const email = getString(contact, "email");
            const isEditing = editingId !== null && contactId === editingId;
            const tags = getArray(contact, "tags");
            const isSelected = Boolean(selectedContactIds[key]);

            return (
              <li
                key={contactId ?? `contact:${index}`}
                data-state={isSelected ? "selected" : undefined}
                className="group px-2 py-1.5 text-sm data-[state=selected]:bg-accent/40"
              >
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
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleContact(key, contact)}
                      aria-label={`Select ${name}`}
                      className="shrink-0"
                    />
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
        </>
      ) : null}

      {groups.length > 0 ? (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
            <span>
              <span className="font-medium">Groups</span>
              <span className="ml-2">{selectedGroups.length} selected</span>
            </span>
            <div className="flex gap-1">
              <Button type="button" size="xs" variant="ghost" onClick={selectAllGroups}>
                Select all
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={clearGroupSelection}>
                Clear
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {groups.map((group, index) => {
              const groupId = getString(group, "id");
              const key = groupKey(group, index);
              const name = getString(group, "name") ?? `Group ${index + 1}`;
              const people = getArray(group, "person_ids").length;
              const isSelected = Boolean(selectedGroupIds[key]);
              return (
                <li
                  key={groupId ?? `group:${index}`}
                  data-state={isSelected ? "selected" : undefined}
                  className="group flex items-center gap-2 px-2 py-1.5 text-sm data-[state=selected]:bg-accent/40"
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleGroup(key, group)}
                    aria-label={`Select ${name}`}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium">{name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{people} people</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
