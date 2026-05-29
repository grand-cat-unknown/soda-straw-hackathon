import { sendJson } from "../shared/http.js";

const calendarEvents = [
  {
    id: "evt_001",
    title: "Hackathon",
    startsAt: "2026-05-30T09:00:00+02:00",
    endsAt: "2026-05-30T21:00:00+02:00",
    location: "Hackathon venue"
  }
];

export const calendarTool = {
  id: "calendar",
  name: "Calendar",
  capabilities: [
    {
      id: "calendar.list",
      tool: "calendar",
      name: "List Calendar Events",
      description: "Read upcoming calendar events.",
      method: "GET",
      endpoint: "/calendar/events",
      responseSchema: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: { type: "object" }
          }
        },
        required: ["events"]
      }
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "GET" || url.pathname !== "/calendar/events") {
      return false;
    }

    sendJson(response, 200, { events: calendarEvents });
    return true;
  }
};
