import { fetchStrawCatalog } from "@/lib/soda-straw-catalog";

export const runtime = "nodejs";

export async function GET() {
  const catalog = await fetchStrawCatalog();
  return Response.json({ catalog });
}
