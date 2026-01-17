// api/speech.ts
export const config = {
    runtime: 'edge',
  };
  
  export default async function handler(req: Request) {
    const apiKey = process.env.OPENAI_API_KEY;
  
    if (!apiKey) {
      return new Response("Sem chave API", { status: 500 });
    }
  
    try {
      const { input } = await req.json();
  
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: input.substring(0, 4096), // Limite de segurança
          voice: "onyx",
        }),
      });
  
      return new Response(response.body, {
        headers: { "Content-Type": "audio/mpeg" },
      });
  
    } catch (error) {
      return new Response("Erro ao gerar áudio", { status: 500 });
    }
  }