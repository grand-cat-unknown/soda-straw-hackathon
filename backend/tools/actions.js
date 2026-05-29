import { readJson, sendJson } from "../shared/http.js";
import { assertObject, optionalString } from "../shared/validation.js";

export const actionsTool = {
  id: "actions",
  name: "Actions",
  capabilities: [
    {
      id: "actions.simulate",
      tool: "actions",
      name: "Simulate Action",
      description: "Pretend to execute a tool call and return a traceable result.",
      method: "POST",
      endpoint: "/actions/simulate",
      requestSchema: {
        type: "object",
        properties: {
          capability: { type: "string" },
          input: { type: "object" }
        }
      },
      responseSchema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          actionId: { type: "string" },
          capability: { type: "string" },
          status: { type: "string" },
          received: { type: "object" }
        },
        required: ["ok", "actionId", "capability", "status", "received"]
      }
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "POST" || url.pathname !== "/actions/simulate") {
      return false;
    }

    const payload = await readJson(request);
    assertObject(payload);

    sendJson(response, 200, {
      ok: true,
      actionId: `act_${Date.now()}`,
      capability: optionalString(payload.capability, "unknown", "capability"),
      status: "simulated",
      received: payload
    });
    return true;
  }
};
