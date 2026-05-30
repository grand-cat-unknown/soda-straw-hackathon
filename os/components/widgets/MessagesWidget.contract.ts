import {
  AnySchema,
  UnknownArraySchema,
  UnknownRecordSchema,
} from "@/lib/workspace/schemas";
import type { WidgetContract } from "@/lib/workspace/types";

export const MessagesWidgetContract: WidgetContract = {
  type: "messages",
  title: "Messages",
  description: "Renders message drafts, send receipts, and reply tracking.",
  inputs: {
    draft: {
      schema: UnknownRecordSchema,
      description: "Message draft from messages.draft.",
      optional: true,
    },
    sent: {
      schema: UnknownRecordSchema,
      description: "Send receipt from messages.send.",
      optional: true,
    },
    tracking: {
      schema: UnknownRecordSchema,
      description: "Reply tracking result from messages.track_replies.",
      optional: true,
    },
    replies: {
      schema: UnknownArraySchema,
      description: "Replies being tracked.",
      optional: true,
    },
    result: {
      schema: AnySchema,
      description: "Raw messages capability result.",
      optional: true,
    },
  },
  outputs: {
    draft: {
      schema: UnknownRecordSchema,
      description: "Draft selected by the user.",
    },
    message: {
      schema: UnknownRecordSchema,
      description: "Sent message or tracking record selected by the user.",
    },
  },
  render: {
    renderer: "messages",
    defaultLayout: { x: 0, y: 0, w: 50, h: 5 },
    minLayout: { w: 33, h: 3 },
    chrome: "card",
    editable: true,
    outputActions: {
      draft: "Use draft button",
      message: "Use message button",
    },
  },
};
