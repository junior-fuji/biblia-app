export const askTheologian = async (book: string, chapter: number, verse: number, text: string) => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    console.error("ERRO: Chave API não encontrada no Vercel.");
    return { original: "Erro de Configuração: Chave de API ausente." };
  }

  // AQUI ESTÁ A MÁGICA: O Prompt Completo e Detalhado voltou!
  const prompt = `
    Atue como um especialista sênior em Teologia Bíblica, Exegese e Línguas Originais (Hebraico/Grego).
    
    Analise profundamente o versículo: ${book} ${chapter}:${verse} - "${text}".
    
    Forneça uma resposta rica, estruturada em um JSON estrito (sem markdown), seguindo EXATAMENTE este formato:
    {
      "original": "Faça uma análise exegética detalhada. Explore o significado das palavras chaves no original (hebraico/grego), tempos verbais e nuances que não aparecem na tradução. Escreva em texto corrido e profundo.",
      
      "context": "Explique o contexto histórico, cultural e literário. Quem escreveu? Para quem? O que estava acontecendo na época? Como isso afeta o entendimento do texto?",
      
      "references": [
        { 
          "ref": "Ex: Rm 3:23", 
          "type": "Correlação", 
          "text": "Texto resumido do versículo relacionado...", 
          "reason": "Explique brevemente a conexão teológica com o versículo analisado." 
        },
        {
          "ref": "Outra referência",
          "type": "Profecia/Cumprimento",
          "text": "...",
          "reason": "..."
        }
      ],
      
      "application": "Traga uma aplicação pastoral e devocional prática e impactante para os dias de hoje. Como esse versículo muda nossa vida hoje?"
    }
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Modelo rápido e inteligente
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5, // Um pouco mais criativo para a teologia
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { original: `Erro na resposta da IA: ${data.error?.message}` };
    }

    let content = data.choices[0].message.content.trim();
    // Limpeza para garantir que o JSON não quebre
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro no fetch:", error);
    return { original: "Não foi possível conectar ao servidor de Inteligência Artificial." };
  }
};