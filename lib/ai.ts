// lib/ai.ts

export const askTheologian = async (book: string, chapter: number, verse: number, text: string) => {
  
  // O SUPER PROMPT DE TEOLOGIA (NÍVEL PHD)
  const prompt = `
    Você é um renomado PhD em Teologia Bíblica, Especialista em Exegese do Antigo (Hebraico) e Novo Testamento (Grego Koinê).
    
    REALIZAR ANÁLISE DO TEXTO: ${book} ${chapter}:${verse} - "${text}".
    
    Diretrizes Estritas:
    1. Use o Método Gramático-Histórico.
    2. Identifique nuances do original (ex: tempos verbais no grego como Aoristo/Imperfeito ou troncos verbais no hebraico).
    3. Evite superficialidade. Seja profundo, técnico mas acessível pastoralmente.
    
    Gere APENAS um JSON puro (sem markdown, sem crases), seguindo exatamente este esquema:
    {
      "original": "Faça uma análise técnica do texto original. Cite as palavras chaves em Hebraico/Grego (transliterado) e explique seu peso semântico. Explique a gramática (tempos verbais, preposições) e como isso altera o entendimento.",
      
      "context": "Descreva o cenário histórico, cultural e literário. Quem é o autor? Qual a tensão do momento? Onde isso se encaixa na narrativa maior do livro?",
      
      "references": [
        { 
          "ref": "Ex: Rm 5:1", 
          "type": "Teologia Sistemática", 
          "text": "Resumo do texto...", 
          "reason": "Explique a conexão doutrinária (ex: Justificação, Santificação, Aliança)." 
        },
        { 
          "ref": "Ex: Sl 23:1", 
          "type": "Paralelismo", 
          "text": "Resumo do texto...", 
          "reason": "Explique como este texto ecoa ou cumpre o versículo analisado." 
        }
      ],
      
      "application": "Traga uma aplicação homilética poderosa. Como essa verdade teológica profunda muda a segunda-feira do crente comum? Dê um imperativo prático."
    }
  `;

  try {
    // Chama o seu servidor seguro (api/chat)
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }]
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Erro do Servidor:", data.error);
      return { original: "O servidor de teologia está indisponível no momento." };
    }

    if (!data.choices || !data.choices[0]) {
      return { original: "A IA não retornou uma análise válida." };
    }

    // Processamento e Limpeza da resposta
    let content = data.choices[0].message.content.trim();
    
    // Remove qualquer marcação de código que a IA possa ter colocado (```json ...)
    const jsonString = content.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Erro de conexão no Client:", error);
    return { original: "Erro de comunicação. Verifique sua internet." };
  }
};