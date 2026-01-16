// lib/ai.ts
export const askTheologian = async (book: string, chapter: number, verse: number, text: string) => {
    
export const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

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
         'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", 
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });
  
      const data = await response.json();
      if (!data.choices) return null;

      let content = data.choices[0].message.content.trim();
      
      // Limpeza de markdown
      const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);
  
    } catch (error) {
      console.error("Erro na IA:", error);
      return null;
    }
};