export type StrawCatalogEntry = {
  name: string;
  description: string;
};

type RawStraw = {
  straw_name?: string;
  description?: string;
  has_access?: boolean;
  is_system?: boolean;
  connection?: string;
};

const CATALOG_TTL_MS = 5 * 60 * 1000;
const STRAW_PREFIX = "fluid-os-";

let cached: { at: number; catalog: StrawCatalogEntry[] } | null = null;

function sodaStrawBaseUrl(): string | null {
  const mcpUrl = process.env.SODA_STRAW_MCP_URL;
  if (!mcpUrl) return null;
  // SODA_STRAW_MCP_URL points at /mcp; the REST API lives at the same origin.
  try {
    const url = new URL(mcpUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export async function fetchStrawCatalog(): Promise<StrawCatalogEntry[]> {
  const apiKey =
    process.env.SODA_STRAW_AGENT_API_KEY ?? process.env.SODA_STRAW_API_KEY;
  const baseUrl = sodaStrawBaseUrl();
  if (!apiKey || !baseUrl) return [];

  if (cached && Date.now() - cached.at < CATALOG_TTL_MS) {
    return cached.catalog;
  }

  try {
    const response = await fetch(`${baseUrl}/api/straws`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!response.ok) return cached?.catalog ?? [];

    const data = (await response.json()) as { straws?: RawStraw[] };
    const straws = Array.isArray(data.straws) ? data.straws : [];

    const catalog: StrawCatalogEntry[] = straws
      .filter(
        (s) =>
          typeof s.straw_name === "string" &&
          s.straw_name.startsWith(STRAW_PREFIX) &&
          s.has_access !== false &&
          !s.is_system &&
          s.connection !== "error" &&
          s.connection !== "paused",
      )
      .map((s) => ({
        name: (s.straw_name ?? "").slice(STRAW_PREFIX.length),
        description: s.description ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    cached = { at: Date.now(), catalog };
    return catalog;
  } catch {
    return cached?.catalog ?? [];
  }
}

export function catalogToSystemFragment(catalog: StrawCatalogEntry[]): string {
  if (catalog.length === 0) return "";
  const lines = catalog.map(
    (entry) => `  - ${entry.name}: ${entry.description}`,
  );
  return [
    "These Soda Straw tools are already attached and directly callable — do NOT call any discovery tool to list them:",
    ...lines,
  ].join("\n");
}
