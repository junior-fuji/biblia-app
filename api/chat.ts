// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { maxDuration: 60 };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: 'OPENAI_API_KEY não configurada no servidor (Vercel/env).',
      });
    }

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Body inválido. Esperado: { messages: [...] }',
      });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const upstream = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
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
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || 'Erro ao chamar OpenAI',
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
