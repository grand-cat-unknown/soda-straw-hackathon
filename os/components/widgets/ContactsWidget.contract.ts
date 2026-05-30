import {
  AnySchema,
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
    defaultLayout: { x: 0, y: 0, w: 50, h: 5 },
    minLayout: { w: 33, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      selectedContact: "Contact selection buttons",
      selectedGroup: "Group selection buttons",
    },
  },
};
