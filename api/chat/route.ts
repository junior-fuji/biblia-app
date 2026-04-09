import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages inválido" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
    });

    return Response.json(completion, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, hint: "use POST" }, { status: 200 });
}