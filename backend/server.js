import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";

const contacts = [
  { id: "c_001", name: "Maya Rao", relationship: "close friend", tags: ["friends", "design"], city: "Brussels" },
  { id: "c_002", name: "Leo Martins", relationship: "friend", tags: ["friends", "music"], city: "Brussels" },
  { id: "c_003", name: "Aisha Khan", relationship: "coworker", tags: ["work", "food"], city: "Ghent" },
  { id: "c_004", name: "Jonas Peeters", relationship: "neighbor", tags: ["neighbors"], city: "Brussels" },
  { id: "c_005", name: "Nina Verma", relationship: "close friend", tags: ["friends", "planning"], city: "Antwerp" },
  { id: "c_006", name: "Tom Jacobs", relationship: "friend", tags: ["friends", "drinks"], city: "Brussels" }
];

const calendarEvents = [
  {
    id: "evt_001",
    title: "Hackathon",
    startsAt: "2026-05-30T09:00:00+02:00",
    endsAt: "2026-05-30T21:00:00+02:00",
    location: "Hackathon venue"
  }
];

const tasks = [
  { id: "t_001", title: "Buy drinks", status: "open", due: "2026-05-30" },
  { id: "t_002", title: "Prepare playlist", status: "open", due: "2026-05-30" },
  { id: "t_003", title: "Send invites", status: "done", due: "2026-05-29" }
];

const shoppingCatalog = [
  { id: "sku_001", name: "Sparkling water pack", category: "drinks", price: 8.5, serves: 8 },
  { id: "sku_002", name: "Tortilla chips", category: "snacks", price: 3.2, serves: 4 },
  { id: "sku_003", name: "Salsa trio", category: "snacks", price: 5.4, serves: 6 },
  { id: "sku_004", name: "Paper plates", category: "supplies", price: 4.8, serves: 20 },
  { id: "sku_005", name: "String lights", category: "decor", price: 14.0, serves: 1 },
  { id: "sku_006", name: "Lemonade bottles", category: "drinks", price: 6.7, serves: 10 }
];

const capabilities = [
  {
    id: "contacts.search",
    name: "Search Contacts",
    description: "Find people by name, relationship, city, or tag.",
    method: "GET",
    endpoint: "/contacts"
  },
  {
    id: "calendar.list",
    name: "List Calendar Events",
    description: "Read upcoming calendar events.",
    method: "GET",
    endpoint: "/calendar/events"
  },
  {
    id: "tasks.list",
    name: "List Tasks",
    description: "Read open and completed tasks.",
    method: "GET",
    endpoint: "/tasks"
  },
  {
    id: "shopping.search",
    name: "Search Shopping Catalog",
    description: "Find mocked products for a plan.",
    method: "GET",
    endpoint: "/shopping/search?q=snacks"
  },
  {
    id: "budget.estimate",
    name: "Estimate Budget",
    description: "Estimate cost from guest count, budget target, and categories.",
    method: "POST",
    endpoint: "/budget/estimate"
  },
  {
    id: "messages.draft",
    name: "Draft Message",
    description: "Create a draft invite or follow-up message.",
    method: "POST",
    endpoint: "/messages/draft"
  },
  {
    id: "actions.simulate",
    name: "Simulate Action",
    description: "Pretend to execute a tool call and return a traceable result.",
    method: "POST",
    endpoint: "/actions/simulate"
  }
];

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(body, null, 2));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function filterContacts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return contacts;

  return contacts.filter((contact) => {
    const searchable = [
      contact.name,
      contact.relationship,
      contact.city,
      ...contact.tags
    ].join(" ").toLowerCase();

    return searchable.includes(q);
  });
}

function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q) return shoppingCatalog;

  return shoppingCatalog.filter((item) => {
    return [item.name, item.category].join(" ").toLowerCase().includes(q);
  });
}

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

async function route(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true, service: "fluid-os-mock-backend" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/capabilities") {
    sendJson(response, 200, { capabilities });
    return;
  }

  if (request.method === "GET" && url.pathname === "/contacts") {
    sendJson(response, 200, { contacts: filterContacts(url.searchParams.get("q") || "") });
    return;
  }

  if (request.method === "GET" && url.pathname === "/calendar/events") {
    sendJson(response, 200, { events: calendarEvents });
    return;
  }

  if (request.method === "GET" && url.pathname === "/tasks") {
    sendJson(response, 200, { tasks });
    return;
  }

  if (request.method === "GET" && url.pathname === "/shopping/search") {
    sendJson(response, 200, { items: searchCatalog(url.searchParams.get("q") || "") });
    return;
  }

  if (request.method === "POST" && url.pathname === "/budget/estimate") {
    const payload = await readJson(request);
    sendJson(response, 200, estimateBudget(payload));
    return;
  }

  if (request.method === "POST" && url.pathname === "/messages/draft") {
    const payload = await readJson(request);
    sendJson(response, 200, draftMessage(payload));
    return;
  }

  if (request.method === "POST" && url.pathname === "/actions/simulate") {
    const payload = await readJson(request);
    sendJson(response, 200, {
      ok: true,
      actionId: `act_${Date.now()}`,
      capability: payload.capability || "unknown",
      status: "simulated",
      received: payload
    });
    return;
  }

  sendJson(response, 404, {
    error: "Not found",
    availableEndpoints: capabilities.map((capability) => capability.endpoint)
  });
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => {
    sendJson(response, 500, {
      error: "Internal server error",
      message: error.message
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Mock backend running at http://${HOST}:${PORT}`);
});
