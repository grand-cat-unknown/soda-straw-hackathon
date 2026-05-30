import {
  AnySchema,
  StringSchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const ContactsWidgetContract: WidgetContract = {
  type: "contacts",
  title: "Contacts",
  description: "Renders people and groups from the contacts capability.",
  inputs: {
    contacts: {
      schema: UnknownArraySchema,
      description: "Contact records from contacts.search.",
      optional: true,
    },
    tag: {
      schema: StringSchema,
      description: "Optional contact tag to filter the rendered contact list by.",
      optional: true,
    },
    tags: {
      schema: UnknownArraySchema,
      description: "Optional contact tags to filter the rendered contact list by. Matches any tag.",
      optional: true,
    },
    contact: {
      schema: UnknownRecordSchema,
      description: "Single contact record.",
      optional: true,
    },
    groups: {
      schema: UnknownArraySchema,
      description: "Groups from contacts.list_groups.",
      optional: true,
    },
    group: {
      schema: UnknownRecordSchema,
      description: "Single contact group.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw contacts capability result.",
      optional: true,
    },
  },
  outputs: {
    selectedContact: {
      schema: UnknownRecordSchema,
      description: "Contact selected by the user.",
    },
    selectedGroup: {
      schema: UnknownRecordSchema,
      description: "Group selected by the user.",
    },
  },
  render: {
    renderer: "contacts",
    defaultLayout: { size: "medium", col: 0, row: 0 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedContact: "Contact selection buttons",
      selectedGroup: "Group selection buttons",
    },
  },
  toolCandidates: [
    {
      capabilityId: "contacts.search",
      inputPort: "contacts",
      resultPath: "$.contacts",
      purpose: "Render matching contacts from the backend. Optionally pass binding params { tag: 'friends' } or { tags: ['friends', 'work'] } when the user asks for a tag-filtered contacts list; omit tag params to show all contacts.",
    },
    {
      capabilityId: "contacts.get",
      inputPort: "contact",
      resultPath: "$",
      purpose: "Render one contact from the backend.",
    },
    {
      capabilityId: "contacts.list_groups",
      inputPort: "groups",
      resultPath: "$.groups",
      purpose: "Render contact groups from the backend.",
    },
  ],
  toolActions: {
    createContact: {
      capabilityId: "contacts.create",
      refreshBindings: ["contacts"],
    },
    updateContact: {
      capabilityId: "contacts.update",
      refreshBindings: ["contacts", "contact"],
    },
    createGroup: {
      capabilityId: "contacts.create_group",
      refreshBindings: ["groups"],
    },
    deleteContact: {
      capabilityId: "contacts.delete",
      refreshBindings: ["contacts"],
    },
    deleteGroup: {
      capabilityId: "contacts.delete_group",
      refreshBindings: ["groups"],
    },
  },
};
