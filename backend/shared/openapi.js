export function createOpenApiDocument({ host, port, capabilities }) {
  const paths = {};

  for (const capability of capabilities) {
    const path = capability.endpoint.split("?")[0];
    const method = capability.method.toLowerCase();

    paths[path] = paths[path] || {};
    paths[path][method] = {
      operationId: capability.id,
      summary: capability.name,
      description: capability.description,
      tags: [capability.tool || "tools"],
      parameters: capability.querySchema
        ? Object.entries(capability.querySchema.properties || {}).map(([name, schema]) => ({
            name,
            in: "query",
            required: capability.querySchema.required?.includes(name) || false,
            schema
          }))
        : [],
      requestBody: capability.requestSchema
        ? {
            required: true,
            content: {
              "application/json": {
                schema: capability.requestSchema
              }
            }
          }
        : undefined,
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: capability.responseSchema || { type: "object" }
            }
          }
        },
        400: {
          description: "Invalid request"
        }
      }
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Fluid OS Mock Capability API",
      version: "0.1.0"
    },
    servers: [
      {
        url: `http://${host}:${port}`
      }
    ],
    paths
  };
}
