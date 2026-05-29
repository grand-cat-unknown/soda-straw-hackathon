import http from "node:http";
import { URL } from "node:url";

import { sendError, sendJson } from "./shared/http.js";
import { createOpenApiDocument } from "./shared/openapi.js";
import { tools } from "./tools/index.js";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";

const capabilities = tools.flatMap((tool) => tool.capabilities);

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

  if (request.method === "GET" && url.pathname === "/openapi.json") {
    sendJson(response, 200, createOpenApiDocument({ host: HOST, port: PORT, capabilities }));
    return;
  }

  for (const tool of tools) {
    const handled = await tool.route({ request, response, url });
    if (handled) return;
  }

  sendJson(response, 404, {
    error: "Not found",
    availableEndpoints: capabilities.map((capability) => capability.endpoint)
  });
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => {
    sendError(response, error);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Mock backend running at http://${HOST}:${PORT}`);
});
