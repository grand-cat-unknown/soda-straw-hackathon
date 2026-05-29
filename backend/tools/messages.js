import { readJson, sendJson } from "../shared/http.js";

function draftMessage(payload) {
  const eventName = payload.eventName || "Housewarming";
  const date = payload.date || "next Saturday";
  const tone = payload.tone || "warm";
  const host = payload.host || "Srikanth";

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
      name: "Draft Message",
      description: "Create a draft invite or follow-up message.",
      method: "POST",
      endpoint: "/messages/draft"
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
