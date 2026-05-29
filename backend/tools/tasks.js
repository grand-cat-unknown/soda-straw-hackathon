import { sendJson } from "../shared/http.js";

const tasks = [
  { id: "t_001", title: "Buy drinks", status: "open", due: "2026-05-30" },
  { id: "t_002", title: "Prepare playlist", status: "open", due: "2026-05-30" },
  { id: "t_003", title: "Send invites", status: "done", due: "2026-05-29" }
];

export const tasksTool = {
  id: "tasks",
  name: "Tasks",
  capabilities: [
    {
      id: "tasks.list",
      name: "List Tasks",
      description: "Read open and completed tasks.",
      method: "GET",
      endpoint: "/tasks"
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "GET" || url.pathname !== "/tasks") {
      return false;
    }

    sendJson(response, 200, { tasks });
    return true;
  }
};
