// api/chat.ts
// Endpoint: POST /api/chat
// Requer env no Vercel: OPENAI_API_KEY
// Opcional: OPENAI_MODEL (default: gpt-4o-mini)

export default async function handler(req: any, res: any) {
  // CORS (útil no mobile)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY não configurada no servidor (Vercel/env).',
      });
    }

    // Na Vercel, normalmente req.body já vem como objeto
    // Mas por segurança aceitamos string também
    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }

    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Body inválido. Esperado: { messages: [{role, content}, ...] }',
        received: body,
      });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: (data as any)?.error?.message || 'Erro ao chamar OpenAI',
        raw: data,
      });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Erro interno no /api/chat',
      details: err?.message || String(err),
    });
  }
}
