import { readJson, sendJson } from "../shared/http.js";

export const actionsTool = {
  id: "actions",
  name: "Actions",
  capabilities: [
    {
      id: "actions.simulate",
      name: "Simulate Action",
      description: "Pretend to execute a tool call and return a traceable result.",
      method: "POST",
      endpoint: "/actions/simulate"
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "POST" || url.pathname !== "/actions/simulate") {
      return false;
    }

    const payload = await readJson(request);
    sendJson(response, 200, {
      ok: true,
      actionId: `act_${Date.now()}`,
      capability: payload.capability || "unknown",
      status: "simulated",
      received: payload
    });
    return true;
  }
};
