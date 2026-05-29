import { readJson, sendJson } from "../shared/http.js";

function estimateBudget(payload) {
  const guestCount = Number(payload.guestCount || 8);
  const perGuest = Number(payload.perGuest || 14);
  const categories = Array.isArray(payload.categories) && payload.categories.length > 0
    ? payload.categories
    : ["drinks", "snacks", "supplies"];

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
      name: "Estimate Budget",
      description: "Estimate cost from guest count, budget target, and categories.",
      method: "POST",
      endpoint: "/budget/estimate"
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
