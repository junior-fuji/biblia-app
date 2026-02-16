// api/chat.js
// Vercel Serverless Function (Node.js)
// Endpoint: POST /api/chat
//
// Requer env no Vercel:
// - OPENAI_API_KEY
// Opcional:
// - OPENAI_MODEL (default: gpt-4o-mini)

module.exports = async function handler(req, res) {
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

    // Em Vercel Functions, req.body pode vir como objeto OU string OU vazio.
    // Vamos montar um parser robusto:
    let body = req.body;

    if (!body) {
      // tenta ler como stream
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      body = raw ? JSON.parse(raw) : null;
    } else if (typeof body === 'string') {
      body = JSON.parse(body);
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
        max_tokens: 900,
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || 'Erro ao chamar OpenAI',
        raw: data,
      });
    }

    // Retorna no formato OpenAI (choices/message/content)
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: 'Erro interno no /api/chat',
      details: String(err?.message || err),
    });
  }
};
