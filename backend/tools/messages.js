import { readJson, sendJson } from "../shared/http.js";
import { assertObject, optionalString } from "../shared/validation.js";

function draftMessage(payload) {
  assertObject(payload);

  const eventName = optionalString(payload.eventName, "Housewarming", "eventName");
  const date = optionalString(payload.date, "next Saturday", "date");
  const tone = optionalString(payload.tone, "warm", "tone");
  const host = optionalString(payload.host, "Srikanth", "host");

  return {
    subject: `${eventName} invite`,
    tone,
    body: `Hey! ${host} is planning a ${eventName.toLowerCase()} on ${date}. Would love to have you there. More details soon.`
  };
}

export const messagesTool = {
  id: "messages",
  name: "Messages",
  capabilities: [
    {
      id: "messages.draft",
      tool: "messages",
      name: "Draft Message",
      description: "Create a draft invite or follow-up message.",
      method: "POST",
      endpoint: "/messages/draft",
      requestSchema: {
        type: "object",
        properties: {
          eventName: { type: "string" },
          date: { type: "string" },
          tone: { type: "string" },
          host: { type: "string" }
        }
      },
      responseSchema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          tone: { type: "string" },
          body: { type: "string" }
        },
        required: ["subject", "tone", "body"]
      }
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "POST" || url.pathname !== "/messages/draft") {
      return false;
    }

    const payload = await readJson(request);
    sendJson(response, 200, draftMessage(payload));
    return true;
  }
};
