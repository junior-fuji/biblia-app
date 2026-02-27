// lib/ai.ts
import { Platform } from "react-native";

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;

  // Web (Vercel) -> mesma origem
  if (Platform.OS === "web") return p;

  // Mobile -> precisa do domínio base
  if (!API_BASE) throw new Error("EXPO_PUBLIC_API_BASE_URL não configurada (necessária no mobile).");
  return `${API_BASE}${p}`;
}

function stripToJson(text: string) {
  const raw = String(text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  // tenta achar o primeiro {...} caso venha texto extra
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return raw.slice(first, last + 1);
  return raw;
}

export type TheologianResponse = {
  original?: string;
  context?: string;
  references?: Array<{ ref: string; type: string; text: string; reason: string }>;
  application?: string;
  error?: string;
};

export async function askTheologian(params: {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}): Promise<TheologianResponse> {
  const { book, chapter, verse, text } = params;

  const prompt = `
Você é um renomado PhD em Teologia Bíblica, Especialista em Exegese do Antigo (Hebraico) e Novo Testamento (Grego Koinê).

REALIZAR ANÁLISE DO TEXTO: ${book} ${chapter}:${verse} - "${text}".

Diretrizes Estritas:
1. Use o Método Gramático-Histórico.
2. Identifique nuances do original (ex: tempos verbais no grego como Aoristo/Imperfeito ou troncos verbais no hebraico).
3. Evite superficialidade. Seja profundo, técnico mas acessível pastoralmente.

Gere APENAS um JSON puro (sem markdown, sem crases), seguindo exatamente este esquema:
{
  "original": "...",
  "context": "...",
  "references": [
    { "ref": "Ex: Rm 5:1", "type": "Teologia Sistemática", "text": "Resumo...", "reason": "Conexão doutrinária..." }
  ],
  "application": "..."
}
`.trim();

  try {
    const response = await fetch(apiUrl("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json().catch(() => ({} as any));

    if (!response.ok) {
      // Se seu /api/chat repassa erro da OpenAI, aqui fica claro
      return { error: (data?.error || `HTTP ${response.status}`) as string, original: "Falha ao consultar a IA." };
    }

    const content =
      data?.choices?.[0]?.message?.content ??
      data?.output_text ??
      "";

    if (!content || String(content).trim().length < 2) {
      return { error: "Resposta vazia da IA.", original: "A IA não retornou uma análise válida." };
    }

    const jsonString = stripToJson(content);
    return JSON.parse(jsonString);
  } catch (err: any) {
    return { error: err?.message || "Erro de conexão", original: "Erro de comunicação. Verifique sua internet." };
  }
}