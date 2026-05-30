export const runtime = "nodejs";

type Capability = {
  id: string;
  method: string;
  endpoint: string;
};

function backendBase(): string {
  return (
    process.env.FLUID_OS_BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://127.0.0.1:8787"
  ).replace(/\/$/, "");
}

function backendApiKey(): string {
  return (
    process.env.FLUID_OS_API_KEY ??
    process.env.NEXT_PUBLIC_BACKEND_API_KEY ??
    "fluid-os-dev-key"
  );
}

async function fetchCapabilities(): Promise<Capability[]> {
  const response = await fetch(`${backendBase()}/capabilities`, {
    headers: { "X-API-Key": backendApiKey() },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Capability discovery failed (${response.status}).`);
  }
  const data = (await response.json()) as { capabilities?: unknown };
  return Array.isArray(data.capabilities)
    ? (data.capabilities as Capability[])
    : [];
}

function compileEndpoint(
  endpoint: string,
  params: Record<string, unknown>,
): { path: string; rest: Record<string, unknown> } {
  const rest = { ...params };
  const path = endpoint.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const value = rest[key];
    delete rest[key];
    return encodeURIComponent(String(value ?? ""));
  });
  return { path, rest };
}

function queryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item));
    } else {
      search.set(key, String(value));
    }
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      capabilityId?: unknown;
      params?: unknown;
    };
    if (typeof body.capabilityId !== "string") {
      return Response.json({ error: "capabilityId is required." }, { status: 400 });
    }
    const params =
      body.params && typeof body.params === "object" && !Array.isArray(body.params)
        ? (body.params as Record<string, unknown>)
        : {};

    const capabilities = await fetchCapabilities();
    const capability = capabilities.find((item) => item.id === body.capabilityId);
    if (!capability) {
      return Response.json(
        { error: `Unknown capability ${body.capabilityId}.` },
        { status: 404 },
      );
    }

    const method = capability.method.toUpperCase();
    const { path, rest } = compileEndpoint(capability.endpoint, params);
    const url =
      method === "GET"
        ? `${backendBase()}${path}${queryString(rest)}`
        : `${backendBase()}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": backendApiKey(),
      },
      body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(rest),
      cache: "no-store",
    });
    const text = await response.text();
    const output = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return Response.json(
        { error: output?.detail ?? `Capability call failed (${response.status}).`, output },
        { status: response.status },
      );
    }
    return Response.json({ output });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Capability call failed.",
      },
      { status: 500 },
    );
  }
}
