// lib/openai.ts
import { Alert, Platform } from 'react-native';

export type ChapterOrVerseResult = {
  theme: string;
  exegesis: string;
  history?: string;
  context?: string;
  theology: string;
  application: string;

  // compat antigos
  intro?: string;
  original?: string;
  doctrine?: string;
  conclusion?: string;
};

export type DictionaryResult = {
  term: string;
  definition: string;
  scope: { what_it_is: string; what_it_is_not: string };
  originals: Array<{
    language: 'he' | 'ar' | 'gr';
    lemma: string;
    transliteration: string;
    strong: string;
    gloss: string;
    notes: string;
  }>;
  key_texts: Array<{ reference: string; excerpt: string; explanation: string }>;
  support_texts: Array<{ reference: string; explanation: string }>;
  theological_distinctions: Array<{ title: string; text: string }>;
  related_terms: string[];
  summary: string;
  deep_theology?: string;
};

export type AnalysisResult = ChapterOrVerseResult | DictionaryResult;

type Mode = 'CHAPTER' | 'DICTIONARY' | 'VERSE';

/** =========================
 *  Prompts (COMPLETOS)
 ========================= */

const CHAPTER_SYSTEM = `
Você é um teólogo reformado sênior.
Analise o CAPÍTULO TODO fornecido.
Responda EXCLUSIVAMENTE com JSON válido (sem markdown e sem texto fora do JSON):
{
  "theme": "Resumo do tema central deste capítulo.",
  "exegesis": "Destaque os principais eventos ou argumentos do capítulo.",
  "context": "Onde isso se encaixa na história do livro?",
  "theology": "Doutrinas principais abordadas aqui.",
  "application": "3 lições práticas extraídas do capítulo todo."
}
`.trim();

const VERSE_SYSTEM = `
Você é um exegeta bíblico especialista em línguas originais.
Analise SOMENTE O VERSÍCULO fornecido com precisão cirúrgica.
Foco: Gramática, palavras-chaves (Grego/Hebraico) e sintaxe.
Responda EXCLUSIVAMENTE com JSON válido (sem markdown e sem texto fora do JSON):
{
  "theme": "A ideia central deste versículo único.",
  "exegesis": "Analise palavra por palavra. Cite termos no original (Hebraico/Grego).",
  "context": "Conexão imediata com o versículo anterior e posterior.",
  "theology": "Que verdade teológica específica este versículo ensina?",
  "application": "Como aplicar este versículo específico na vida hoje?"
}
`.trim();

const DICTIONARY_SYSTEM = `
Você é um editor de ENCICLOPÉDIA TEOLÓGICA (nível acadêmico, estilo verbete).
Responda EXCLUSIVAMENTE com JSON válido (sem markdown e sem texto fora do JSON).

Regras:
- Seja completo e específico, sem linguagem devocional.
- Faça distinções conceituais com rigor.
- Sempre inclua referências bíblicas (textos-chave + textos de suporte).
- Não invente citações bíblicas: se estiver incerto, omita o verso específico e diga "referência incerta".
- Não cite autores modernos nem bibliografia externa; foque em Bíblia e teologia sistemática.
- Responda sempre em português.

Formato obrigatório do JSON:
{
  "term": string,
  "definition": string,
  "scope": {
    "what_it_is": string,
    "what_it_is_not": string
  },
  "originals": [
    {
      "language": "he" | "ar" | "gr",
      "lemma": string,
      "transliteration": string,
      "strong": string,
      "gloss": string,
      "notes": string
    }
  ],
  "key_texts": [
    {
      "reference": string,
      "excerpt": string,
      "explanation": string
    }
  ],
  "support_texts": [
    {
      "reference": string,
      "explanation": string
    }
  ],
  "theological_distinctions": [
    {
      "title": string,
      "text": string
    }
  ],
  "related_terms": [string],
  "summary": string
}

Restrições:
- "originals" pode ser [] se o termo não tiver equivalente direto/central em hebraico/grego, mas explique isso em notes.
- "excerpt" deve ser curto (1–2 linhas). Se não souber o texto exato, deixe "" e explique no campo explanation.
`.trim();

function buildUserPrompt(text: string, mode: Mode) {
  const t = (text || '').trim();

  if (mode === 'DICTIONARY') {
    // ⚠️ Mantive “forte” mas não gigante demais (evita timeout/truncamento)
    return `
Escreva um verbete de enciclopédia teológica para o termo: "${t}".

Exigências:
- Definição objetiva + escopo ("o que é" e "o que não é").
- Termos originais quando aplicável (pode ser []).
- Textos-chave: 5 (referência + trecho curto + explicação).
- Textos de suporte: 8 (referência + explicação).
- Distinções teológicas: 5.
- Termos relacionados: 8.
- Resumo final: 3–5 frases.
`.trim();
  }

  if (mode === 'VERSE') {
    return `Analise SOMENTE este versículo (não analise o capítulo inteiro): "${t}"`;
  }

  return `Analise este capítulo: "${t}"`;
}

/** =========================
 *  JSON extraction helpers
 ========================= */

function stripCodeFences(s: string) {
  return (s || '').replace(/```json/gi, '').replace(/```/g, '').trim();
}

function extractFirstJsonObject(s: string): string | null {
  const text = stripCodeFences(String(s || ''));
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function safeParseJson(s: string) {
  const direct = stripCodeFences(s);
  try {
    return JSON.parse(direct);
  } catch {}
  const extracted = extractFirstJsonObject(direct);
  if (!extracted) throw new Error('A IA não retornou JSON válido.');
  return JSON.parse(extracted);
}

/** =========================
 *  URL helpers
 ========================= */

const API_BASE_URL_RAW =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'https://biblia-app-six.vercel.app';

function normalizeBaseUrl(base: string) {
  if (!base) return '';
  if (!/^https?:\/\//i.test(base)) return `https://${base}`;
  return base;
}

const API_BASE_URL = normalizeBaseUrl(API_BASE_URL_RAW);

function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (Platform.OS === 'web') return p; // web -> /api/*
  return `${API_BASE_URL}${p}`; // mobile -> https://.../api/*
}

function alertIfNative(title: string, message: string) {
  if (Platform.OS === 'web') {
    console.error(`${title}: ${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** =========================
 *  Main
 ========================= */

export async function fetchAIAnalysis(
  text: string,
  mode: Mode = 'CHAPTER'
): Promise<AnalysisResult | null> {
  try {
    const systemPrompt =
      mode === 'DICTIONARY' ? DICTIONARY_SYSTEM : mode === 'VERSE' ? VERSE_SYSTEM : CHAPTER_SYSTEM;

    const userPrompt = buildUserPrompt(text, mode);
    const url = apiUrl('/api/chat');

    console.log('[AI] mode:', mode, 'url:', url);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

    const content: string = body?.choices?.[0]?.message?.content ?? body?.output_text ?? '';

    if (!content || String(content).trim().length < 2) {
      throw new Error('Resposta vazia da IA.');
    }

    try {
      return safeParseJson(content) as AnalysisResult;
    } catch {
      const preview = String(content).slice(0, 400);
      throw new Error(`JSON inválido retornado pela IA. Prévia: ${preview}`);
    }
  } catch (error: any) {
    console.error('Erro IA:', error);
    alertIfNative('Erro', error?.message || 'Falha na conexão com Dr. Logos.');
    return null;
  }
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const url = apiUrl('/api/speech');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

    const base64 = body?.audioBase64 || body?.base64 || null;
    return base64 ? String(base64) : null;
  } catch (e: any) {
    console.error('Erro Speech:', e);
    return null;
  }
}
