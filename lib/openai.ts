// lib/openai.ts
import { Alert, Platform } from "react-native";

export type ChapterOrVerseResult = {
  theme: string;
  exegesis: string;
  history?: string;
  context?: string;
  theology: string;
  application: string;

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
    language: "he" | "ar" | "gr";
    lemma: string;
    transliteration: string;
    strong: string;
    gloss: string;
    notes: string;
  }>;
  key_texts: Array<{ reference: string; excerpt: string; explanation: string }>;
  support_texts: Array<{ reference: string; explanation: string }>;
  theological_distinctions: Array<{ title: string; text: string }>;
  deep_theology?: string;
  related_terms: string[];
  summary: string;
};

export type AnalysisResult = ChapterOrVerseResult | DictionaryResult;
type Mode = "CHAPTER" | "DICTIONARY" | "VERSE";

/* prompts (mantidos iguais ao seu) */
const CHAPTER_SYSTEM = `...`.trim();
const VERSE_SYSTEM = `...`.trim();
const DICTIONARY_SYSTEM = `...`.trim();

function buildUserPrompt(text: string, mode: Mode) {
  const t = (text || "").trim();
  if (mode === "DICTIONARY") return `...`.trim();
  if (mode === "VERSE") return `Analise SOMENTE este versículo (não analise o capítulo inteiro): "${t}"`;
  return `Analise este capítulo: "${t}"`;
}

function stripCodeFences(s: string) {
  return (s || "").replace(/```json/gi, "").replace(/```/g, "").trim();
}

function extractFirstJsonObject(s: string): string | null {
  const text = stripCodeFences(String(s || ""));
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function safeParseJson(s: string) {
  const direct = stripCodeFences(s);
  try {
    return JSON.parse(direct);
  } catch {}
  const extracted = extractFirstJsonObject(direct);
  if (!extracted) throw new Error("A IA não retornou JSON válido.");
  return JSON.parse(extracted);
}

// ✅ base url robusta
const API_BASE_URL_RAW =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://biblia-app-six.vercel.app";

function normalizeBaseUrl(base: string) {
  if (!base) return "";
  if (!/^https?:\/\//i.test(base)) return `https://${base}`;
  return base;
}

const API_BASE_URL = normalizeBaseUrl(API_BASE_URL_RAW);

function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (Platform.OS === "web") return p; // web -> /api/*
  return `${API_BASE_URL}${p}`; // mobile -> https://.../api/*
}

function alertIfNative(title: string, message: string) {
  if (Platform.OS === "web") {
    console.error(`${title}: ${message}`);
    return;
  }
  Alert.alert(title, message);
}

export async function fetchAIAnalysis(text: string, mode: Mode = "CHAPTER"): Promise<AnalysisResult | null> {
  try {
    const systemPrompt =
      mode === "DICTIONARY" ? DICTIONARY_SYSTEM : mode === "VERSE" ? VERSE_SYSTEM : CHAPTER_SYSTEM;

    const userPrompt = buildUserPrompt(text, mode);
    const url = apiUrl("/api/chat");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

    const content: string = body?.choices?.[0]?.message?.content ?? body?.output_text ?? "";
    return safeParseJson(content) as AnalysisResult;
  } catch (error: any) {
    console.error("Erro IA:", error);
    alertIfNative("Erro", error?.message || "Falha na conexão com Dr. Logos.");
    return null;
  }
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const url = apiUrl("/api/speech");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

    const base64 = body?.audioBase64 || body?.base64 || null;
    return base64 ? String(base64) : null;
  } catch (e: any) {
    console.error("Erro Speech:", e);
    return null;
  }
}


