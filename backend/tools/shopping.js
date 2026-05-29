import { sendJson } from "../shared/http.js";

const shoppingCatalog = [
  { id: "sku_001", name: "Sparkling water pack", category: "drinks", price: 8.5, serves: 8 },
  { id: "sku_002", name: "Tortilla chips", category: "snacks", price: 3.2, serves: 4 },
  { id: "sku_003", name: "Salsa trio", category: "snacks", price: 5.4, serves: 6 },
  { id: "sku_004", name: "Paper plates", category: "supplies", price: 4.8, serves: 20 },
  { id: "sku_005", name: "String lights", category: "decor", price: 14.0, serves: 1 },
  { id: "sku_006", name: "Lemonade bottles", category: "drinks", price: 6.7, serves: 10 }
];

function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q) return shoppingCatalog;

  return shoppingCatalog.filter((item) => {
    return [item.name, item.category].join(" ").toLowerCase().includes(q);
  });
}

export const shoppingTool = {
  id: "shopping",
  name: "Shopping",
  capabilities: [
    {
      id: "shopping.search",
      name: "Search Shopping Catalog",
      description: "Find mocked products for a plan.",
      method: "GET",
      endpoint: "/shopping/search?q=snacks"
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "GET" || url.pathname !== "/shopping/search") {
      return false;
    }

    sendJson(response, 200, {
      items: searchCatalog(url.searchParams.get("q") || "")
    });
    return true;
  }
};
