// api/chat.ts
export const config = {
    runtime: 'edge', // Deixa a resposta muito rápida
  };
  
  export default async function handler(req: Request) {
    // 1. Busca a senha segura no cofre do servidor
    const apiKey = process.env.OPENAI_API_KEY;
  
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave de API não configurada no servidor" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  
    try {
      // 2. Lê a mensagem que veio do iPhone
      const { messages } = await req.json();
  
      // 3. O Servidor chama a OpenAI (ninguém vê isso acontecendo)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages,
          temperature: 0.5,
        }),
      });
  
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  
    } catch (error) {
      return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }