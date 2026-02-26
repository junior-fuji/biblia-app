import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(openaiRes.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Internal Server Error',
    });
  }
}
