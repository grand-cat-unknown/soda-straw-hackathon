import { sendJson } from "../shared/http.js";

const contacts = [
  { id: "c_001", name: "Maya Rao", relationship: "close friend", tags: ["friends", "design"], city: "Brussels" },
  { id: "c_002", name: "Leo Martins", relationship: "friend", tags: ["friends", "music"], city: "Brussels" },
  { id: "c_003", name: "Aisha Khan", relationship: "coworker", tags: ["work", "food"], city: "Ghent" },
  { id: "c_004", name: "Jonas Peeters", relationship: "neighbor", tags: ["neighbors"], city: "Brussels" },
  { id: "c_005", name: "Nina Verma", relationship: "close friend", tags: ["friends", "planning"], city: "Antwerp" },
  { id: "c_006", name: "Tom Jacobs", relationship: "friend", tags: ["friends", "drinks"], city: "Brussels" }
];

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

export const contactsTool = {
  id: "contacts",
  name: "Contacts",
  capabilities: [
    {
      id: "contacts.search",
      name: "Search Contacts",
      description: "Find people by name, relationship, city, or tag.",
      method: "GET",
      endpoint: "/contacts"
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "GET" || url.pathname !== "/contacts") {
      return false;
    }

    sendJson(response, 200, {
      contacts: filterContacts(url.searchParams.get("q") || "")
    });
    return true;
  }
};
