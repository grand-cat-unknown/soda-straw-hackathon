# Tools

Each file in this folder is a fake capability module.

A tool module owns three things:

1. Mock data
2. Capability metadata
3. Route handling

## Shape

```js
export const exampleTool = {
  id: "example",
  name: "Example",
  capabilities: [
    {
      id: "example.doThing",
      name: "Do Thing",
      description: "A short description for the OS planner.",
      method: "POST",
      endpoint: "/example/do-thing"
    }
  ],
  async route({ request, response, url }) {
    if (request.method !== "POST" || url.pathname !== "/example/do-thing") {
      return false;
    }

    sendJson(response, 200, { ok: true });
    return true;
  }
};
```

## Adding A Tool

1. Create a file in this folder, for example `weather.js`.
2. Export a tool object with `capabilities` and `route`.
3. Add it to `backend/tools/index.js`.

The server automatically exposes the capability in `GET /capabilities`.
