import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY in os/.env" },
      { status: 500 },
    );
  }

  const { message } = (await request.json()) as { message?: unknown };

  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: message.trim(),
  });

  return Response.json({ reply: response.output_text });
}
