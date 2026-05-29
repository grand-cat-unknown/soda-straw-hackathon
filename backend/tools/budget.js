import { readJson, sendJson } from "../shared/http.js";
import { assertObject, optionalNumber, optionalStringArray } from "../shared/validation.js";

function estimateBudget(payload) {
  assertObject(payload);

  const guestCount = optionalNumber(payload.guestCount, 8, "guestCount");
  const perGuest = optionalNumber(payload.perGuest, 14, "perGuest");
  const categories = optionalStringArray(payload.categories, ["drinks", "snacks", "supplies"], "categories");

  const lineItems = categories.map((category) => {
    const multiplier = category === "decor" ? 0.25 : 1;
    const estimate = Math.round(guestCount * perGuest * multiplier * 100) / 100;

    return {
      category,
      estimate
    };
  });

  const total = lineItems.reduce((sum, item) => sum + item.estimate, 0);

  return {
    guestCount,
    perGuest,
    currency: "EUR",
    lineItems,
    total: Math.round(total * 100) / 100
  };
}

export const budgetTool = {
  id: "budget",
  name: "Budget",
  capabilities: [
    {
      id: "budget.estimate",
      tool: "budget",
      name: "Estimate Budget",
      description: "Estimate cost from guest count, budget target, and categories.",
      method: "POST",
      endpoint: "/budget/estimate",
      requestSchema: {
        type: "object",
        properties: {
          guestCount: { type: "number", minimum: 1 },
          perGuest: { type: "number", minimum: 0 },
          categories: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      responseSchema: {
        type: "object",
        properties: {
          guestCount: { type: "number" },
          perGuest: { type: "number" },
          currency: { type: "string" },
          lineItems: {
            type: "array",
            items: { type: "object" }
          },
          total: { type: "number" }
        },
        required: ["guestCount", "perGuest", "currency", "lineItems", "total"]
      }
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "POST" || url.pathname !== "/budget/estimate") {
      return false;
    }

    const payload = await readJson(request);
    sendJson(response, 200, estimateBudget(payload));
    return true;
  }
};
