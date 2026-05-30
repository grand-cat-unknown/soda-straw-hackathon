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

function backendApiKey(): string | null {
  return (
    process.env.FLUID_OS_API_KEY ??
    process.env.NEXT_PUBLIC_BACKEND_API_KEY ??
    null
  );
}

/**
 * Validates the request authentication for accessing backend capabilities.
 * Returns true if the request is authenticated or if capabilities are explicitly
 * allowed for unauthenticated requests via ALLOW_UNAUTHENTICATED_CAPABILITIES.
 */
function isRequestAuthenticated(request: Request): boolean {
  // Check for API key in Authorization header
  const authHeader = request.headers.get("Authorization");
  const expectedApiKey = process.env.FLUID_OS_CAPABILITY_API_KEY;
  
  if (expectedApiKey) {
    // If an API key is configured, require it
    if (!authHeader) return false;
    
    // Support both "Bearer <key>" and direct key formats
    const providedKey = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    
    return providedKey === expectedApiKey;
  }
  
  // If no API key is configured, check if unauthenticated access is explicitly allowed
  // This maintains backward compatibility for development environments
  return process.env.ALLOW_UNAUTHENTICATED_CAPABILITIES === "true";
}

async function fetchCapabilities(): Promise<Capability[]> {
  const apiKey = backendApiKey();
  if (!apiKey) {
    throw new Error(
      "Backend API key is not configured. Set FLUID_OS_API_KEY or NEXT_PUBLIC_BACKEND_API_KEY environment variable."
    );
  }
  
  const response = await fetch(`${backendBase()}/capabilities`, {
    headers: { "X-API-Key": apiKey },
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
    // Validate authentication before processing the request
    const isAuthenticated = isRequestAuthenticated(request);
    if (!isAuthenticated) {
      console.warn("[capability-call] unauthenticated request rejected");
      return Response.json(
        { 
          error: "Authentication required. Set FLUID_OS_CAPABILITY_API_KEY and include Authorization header, or set ALLOW_UNAUTHENTICATED_CAPABILITIES=true for development." 
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      capabilityId?: unknown;
      params?: unknown;
    };
    console.log("[capability-call] request", body);
    if (typeof body.capabilityId !== "string") {
      console.warn("[capability-call] missing capabilityId");
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

    const apiKey = backendApiKey();
    if (!apiKey) {
      throw new Error(
        "Backend API key is not configured. Set FLUID_OS_API_KEY or NEXT_PUBLIC_BACKEND_API_KEY environment variable."
      );
    }

    const method = capability.method.toUpperCase();
    const { path, rest } = compileEndpoint(capability.endpoint, params);
    const url =
      method === "GET"
        ? `${backendBase()}${path}${queryString(rest)}`
        : `${backendBase()}${path}`;

    console.log("[capability-call] forwarding", { method, url });
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(rest),
      cache: "no-store",
    });
    const text = await response.text();
    const output = text ? JSON.parse(text) : null;
    console.log("[capability-call] response", { status: response.status, ok: response.ok });
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
