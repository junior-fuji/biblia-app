export const askTheologian = async (book: string, chapter: number, verse: number, text: string) => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  // Objeto de "Paraquedas" (Resposta padrão em caso de erro)
  const fallbackResponse = {
    original: "⚠️ Erro de Conexão: Não foi possível falar com a IA.",
    context: "Verifique se a Chave API no Vercel está correta e se a conta OpenAI tem saldo ($5+).",
    references: [],
    application: "Por favor, verifique as configurações e tente novamente."
  };

  if (!apiKey) {
    console.error("ERRO CRÍTICO: Chave API ausente.");
    return fallbackResponse;
  }

  const prompt = `
    Atue como um PhD em Teologia Bíblica e Línguas Originais.
    Analise o versículo: ${book} ${chapter}:${verse} - "${text}".
    
    Gere um JSON estrito seguindo este modelo exato. IMPORTANTE: Todos os campos devem ser STRING (texto corrido), nunca objetos ou listas aninhadas (exceto no campo references).
    
    {
      "original": "Análise exegética em texto corrido, sem subdivisões em chaves.",
      "context": "Contexto histórico e cultural em texto corrido.",
      "references": [
        { 
          "ref": "Ex: Rm 3:23", 
          "type": "Ex: Doutrina", 
          "text": "Texto do versículo aqui", 
          "reason": "Explicação da conexão teológica." 
        }
      ],
      "application": "Aplicação pastoral em texto corrido."
    }

    Responda apenas o JSON puro.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ ERRO OPENAI:", data);
      return { 
        ...fallbackResponse, 
        original: `Erro da OpenAI: ${data.error?.message || "Erro desconhecido"}` 
      };
    }

    let content = data.choices[0].message.content.trim();
    // Limpeza bruta para garantir que o JSON funcione
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("❌ Erro Geral:", error);
    return fallbackResponse;
  }
};