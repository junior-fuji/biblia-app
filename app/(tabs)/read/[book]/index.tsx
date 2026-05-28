import { useAppTheme } from '@/src/theme/useAppTheme';
import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { openBibleProjector } from '@/src/services/projector/bibleProjector';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Verse = { id: number; verse: number; text: string };

type RouteParams = {
  book?: string;
  chapter?: string;
  verse?: string;
  from?: string;
  returnTo?: string;
};

type AnalysisData = {
  theme?: string;
  history?: string;
  culture?: string;
  exegesis?: string;
  theology?: string;
  application?: string;
};

type VersionRow = { id: string; code: string; name: string };

const BOOK_MAP: Record<number, { name: string; abbrev: string }> = {
  1: { name: 'Gênesis', abbrev: 'Gn' },
  2: { name: 'Êxodo', abbrev: 'Êx' },
  3: { name: 'Levítico', abbrev: 'Lv' },
  4: { name: 'Números', abbrev: 'Nm' },
  5: { name: 'Deuteronômio', abbrev: 'Dt' },
  6: { name: 'Josué', abbrev: 'Js' },
  7: { name: 'Juízes', abbrev: 'Jz' },
  8: { name: 'Rute', abbrev: 'Rt' },
  9: { name: '1 Samuel', abbrev: '1Sm' },
  10: { name: '2 Samuel', abbrev: '2Sm' },
  11: { name: '1 Reis', abbrev: '1Rs' },
  12: { name: '2 Reis', abbrev: '2Rs' },
  13: { name: '1 Crônicas', abbrev: '1Cr' },
  14: { name: '2 Crônicas', abbrev: '2Cr' },
  15: { name: 'Esdras', abbrev: 'Ed' },
  16: { name: 'Neemias', abbrev: 'Ne' },
  17: { name: 'Ester', abbrev: 'Et' },
  18: { name: 'Jó', abbrev: 'Jó' },
  19: { name: 'Salmos', abbrev: 'Sl' },
  20: { name: 'Provérbios', abbrev: 'Pv' },
  21: { name: 'Eclesiastes', abbrev: 'Ec' },
  22: { name: 'Cânticos', abbrev: 'Ct' },
  23: { name: 'Isaías', abbrev: 'Is' },
  24: { name: 'Jeremias', abbrev: 'Jr' },
  25: { name: 'Lamentações', abbrev: 'Lm' },
  26: { name: 'Ezequiel', abbrev: 'Ez' },
  27: { name: 'Daniel', abbrev: 'Dn' },
  28: { name: 'Oseias', abbrev: 'Os' },
  29: { name: 'Joel', abbrev: 'Jl' },
  30: { name: 'Amós', abbrev: 'Am' },
  31: { name: 'Obadias', abbrev: 'Ob' },
  32: { name: 'Jonas', abbrev: 'Jn' },
  33: { name: 'Miqueias', abbrev: 'Mq' },
  34: { name: 'Naum', abbrev: 'Na' },
  35: { name: 'Habacuque', abbrev: 'Hc' },
  36: { name: 'Sofonias', abbrev: 'Sf' },
  37: { name: 'Ageu', abbrev: 'Ag' },
  38: { name: 'Zacarias', abbrev: 'Zc' },
  39: { name: 'Malaquias', abbrev: 'Ml' },
  40: { name: 'Mateus', abbrev: 'Mt' },
  41: { name: 'Marcos', abbrev: 'Mc' },
  42: { name: 'Lucas', abbrev: 'Lc' },
  43: { name: 'João', abbrev: 'Jo' },
  44: { name: 'Atos', abbrev: 'At' },
  45: { name: 'Romanos', abbrev: 'Rm' },
  46: { name: '1 Coríntios', abbrev: '1Co' },
  47: { name: '2 Coríntios', abbrev: '2Co' },
  48: { name: 'Gálatas', abbrev: 'Gl' },
  49: { name: 'Efésios', abbrev: 'Ef' },
  50: { name: 'Filipenses', abbrev: 'Fp' },
  51: { name: 'Colossenses', abbrev: 'Cl' },
  52: { name: '1 Tessalonicenses', abbrev: '1Ts' },
  53: { name: '2 Tessalonicenses', abbrev: '2Ts' },
  54: { name: '1 Timóteo', abbrev: '1Tm' },
  55: { name: '2 Timóteo', abbrev: '2Tm' },
  56: { name: 'Tito', abbrev: 'Tt' },
  57: { name: 'Filemom', abbrev: 'Fm' },
  58: { name: 'Hebreus', abbrev: 'Hb' },
  59: { name: 'Tiago', abbrev: 'Tg' },
  60: { name: '1 Pedro', abbrev: '1Pe' },
  61: { name: '2 Pedro', abbrev: '2Pe' },
  62: { name: '1 João', abbrev: '1Jo' },
  63: { name: '2 João', abbrev: '2Jo' },
  64: { name: '3 João', abbrev: '3Jo' },
  65: { name: 'Judas', abbrev: 'Jd' },
  66: { name: 'Apocalipse', abbrev: 'Ap' },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const API_BASE_URL_RAW =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'https://biblia-app-six.vercel.app';

function normalizeBaseUrl(base: string) {
  if (!base) return '';
  if (!/^https?:\/\//i.test(base)) return `https://${base}`;
  return base;
}

const API_BASE_URL = normalizeBaseUrl(API_BASE_URL_RAW);

function extractJsonObject(text: string): string | null {
  if (!text) return null;
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function getAnalysisLanguage(versionCode: string) {
  const code = String(versionCode || '').trim().toUpperCase();

  if (
    code.includes('RVR') ||
    code.includes('RV') ||
    code.includes('REINA') ||
    code.includes('ESPA') ||
    code.includes('SPAN')
  ) {
    return 'es';
  }

  if (
    code.includes('KOUGO') ||
    code.includes('JP') ||
    code.includes('JAP') ||
    code.includes('JAPA') ||
    code.includes('JPN') ||
    code.includes('JAPANESE') ||
    code.includes('JAPAN') ||
    code.includes('口語') ||
    code.includes('新改') ||
    code.includes('新共同') ||
    code.includes('共同訳') ||
    code.includes('聖書')
  ) {
    return 'ja';
  }

  if (
    code.includes('KJV') ||
    code.includes('WEB') ||
    code.includes('NIV') ||
    code.includes('NLT') ||
    code.includes('ESV')
  ) {
    return 'en';
  }

  return 'pt';
}

function buildChapterPrompt(
  language: 'pt' | 'es' | 'ja' | 'en',
  bookName: string,
  chapterNum: number,
) {
  if (language === 'es') {
    return `Escribe un comentario bíblico extenso, erudito y profundamente detallado sobre ${bookName} capítulo ${chapterNum}. Analiza el capítulo como una unidad completa, explicando su tema central, contexto histórico, contexto cultural, estructura literaria, exégesis, teología bíblica y aplicación pastoral.`;
  }

  if (language === 'ja') {
    return `${bookName} ${chapterNum}章について、広く深い学術的な聖書注解を書いてください。この章を一つの完全な文学的単位として扱い、中心主題、歴史的背景、文化的背景、文学構造、釈義、聖書神学、そして牧会的適用を詳しく説明してください。`;
  }

  if (language === 'en') {
    return `Write a broad, scholarly, deeply detailed biblical commentary on ${bookName} chapter ${chapterNum}. Analyze the chapter as a complete literary unit, explaining its central theme, historical background, cultural background, literary structure, exegesis, biblical theology, and pastoral application.`;
  }

  return `Escreva um comentário bíblico amplo, erudito e profundamente detalhado sobre ${bookName} capítulo ${chapterNum}. Analise o capítulo como uma unidade literária completa, explicando tema central, contexto histórico, contexto cultural, estrutura literária, exegese, teologia bíblica e aplicação pastoral.`;
}

function buildVersePrompt(
  language: 'pt' | 'es' | 'ja' | 'en',
  verseText: string,
  bookName: string,
  chapterNum: number,
  verseNum: number,
) {
  if (language === 'es') {
    return `Haz una exégesis profundamente detallada del versículo "${verseText}" (${bookName} ${chapterNum}:${verseNum}). Analiza su idea central, contexto histórico, contexto cultural, matices de los idiomas originales, estructura gramatical, implicaciones teológicas y aplicación pastoral fiel al texto.`;
  }

  if (language === 'ja') {
    return `「${verseText}」（${bookName} ${chapterNum}:${verseNum}）について、深く詳細な釈義を行ってください。中心思想、歴史的背景、文化的背景、原語のニュアンス、文法構造、神学的意味、本文に忠実な牧会的適用を分析してください。`;
  }

  if (language === 'en') {
    return `Provide a deeply detailed exegetical analysis of the verse "${verseText}" (${bookName} ${chapterNum}:${verseNum}). Analyze its central idea, historical background, cultural background, original-language nuances, grammatical structure, theological implications, and faithful pastoral application.`;
  }

  return `Faça uma exegese profundamente detalhada do versículo "${verseText}" (${bookName} ${chapterNum}:${verseNum}). Analise sua ideia central, contexto histórico, contexto cultural, nuances do original, estrutura gramatical, implicações teológicas e aplicação pastoral fiel ao texto.`;
}

let versionsCache: VersionRow[] | null = null;
let versionIdByCode: Map<string, string> | null = null;

async function fetchVersions(): Promise<VersionRow[]> {
  if (versionsCache) return versionsCache;

  const sb = getSupabaseOrNull();
  if (!sb) throw new Error('Supabase indisponível neste build.');

  const { data, error } = await sb
    .from('bible_versions')
    .select('id, code, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  versionsCache = (data ?? []) as VersionRow[];
  versionIdByCode = new Map(versionsCache.map((v) => [v.code, v.id]));
  return versionsCache;
}

async function resolveVersionId(code: string): Promise<string> {
  if (!versionIdByCode) await fetchVersions();
  const id = versionIdByCode!.get(code);
  if (!id) throw new Error(`Versão não encontrada: ${code}`);
  return id;
}

function buildAnalysisEnvelope(params: {
  bookId: number;
  chapter: number;
  verse?: number | null;
  label: string;
  title: string;
  analysisData: AnalysisData | null;
  rawAi: string;
}) {
  const { bookId, chapter, verse, label, title, analysisData, rawAi } = params;

  return {
    version: 2,
    kind: 'ai_bible_study',
    type: verse ? 'verse' : 'chapter',
    ref: {
      book_id: bookId,
      chapter,
      verse: verse ?? null,
      label,
    },
    title,
    analysis: analysisData
      ? {
          theme: analysisData.theme || '',
          history: analysisData.history || '',
          culture: analysisData.culture || '',
          exegesis: analysisData.exegesis || '',
          theology: analysisData.theology || '',
          application: analysisData.application || '',
        }
      : null,
    raw: rawAi || null,
  };
}

function InfoCard({
  title,
  text,
  color,
  icon,
}: {
  title: string;
  text?: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  if (!text) return null;

  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoBar, { backgroundColor: color }]} />
      <View style={styles.infoContent}>
        <View style={styles.infoHeader}>
          <Ionicons name={icon} size={18} color={color} style={{ marginRight: 8 }} />
          <Text style={[styles.infoTitle, { color }]}>{title}</Text>
        </View>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

export default function ReadBookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Verse>>(null);
  const isWeb = Platform.OS === 'web';
  const { colors } = useAppTheme();
  const { book, chapter, verse, returnTo } = useLocalSearchParams<RouteParams>();
  const bookId = Number(book);
  const isValidBook = !!book && Number.isFinite(bookId);
  const returnToStr = typeof returnTo === 'string' ? returnTo : undefined;

  const initialChapter = useMemo(() => {
    const c = chapter ? Number(chapter) : 1;
    return Number.isFinite(c) && c > 0 ? c : 1;
  }, [chapter]);

  const initialVerse = useMemo(() => {
    const v = verse ? Number(verse) : NaN;
    return Number.isFinite(v) && v > 0 ? v : undefined;
  }, [verse]);

  const bookData = isValidBook
    ? BOOK_MAP[bookId] ?? { name: 'Livro', abbrev: '' }
    : { name: 'Livro', abbrev: '' };
  const safeBookName = bookData.name || 'Livro';

  const [versionCode, setVersionCode] = useState<string>('ARA');
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [chapterNum, setChapterNum] = useState<number>(initialChapter);
  const [totalChapters, setTotalChapters] = useState(0);
  const [versesState, setVersesState] = useState<Verse[]>([]);
  const [showChapters, setShowChapters] = useState(false);
  const [fontSize, setFontSize] = useState(20);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [rawAi, setRawAi] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveReference, setSaveReference] = useState('');
  const [saveVerse, setSaveVerse] = useState<number | null>(null);

  useEffect(() => {
    setChapterNum((current) => (current !== initialChapter ? initialChapter : current));
  }, [initialChapter]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const list = await fetchVersions();
        if (!alive) return;
        setVersions(list);

        if (list.length > 0 && !list.some((v) => v.code === versionCode)) {
          setVersionCode(list[0].code);
        }
      } catch (e) {
        console.log('FETCH_VERSIONS_ERROR', e);
        if (!alive) return;

        setVersions([
          { id: 'fallback-ara', code: 'ARA', name: 'ARA' },
          { id: 'fallback-arc', code: 'ARC', name: 'ARC' },
          { id: 'fallback-acf', code: 'ACF', name: 'ACF' },
          { id: 'fallback-nvi', code: 'NVI', name: 'NVI' },
          { id: 'fallback-kja', code: 'KJA', name: 'KJA' },
          { id: 'fallback-rv1909', code: 'RV1909', name: 'RV1909' },
          { id: 'fallback-kougo', code: 'KOUGO', name: 'KOUGO' },
          { id: 'fallback-kjv', code: 'KJV', name: 'KJV' },
          { id: 'fallback-web', code: 'WEB', name: 'WEB' },
        ]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [versionCode]);

  useEffect(() => {
    let alive = true;

    async function loadTotal() {
      if (!isValidBook) return;

      try {
        const sb = getSupabaseOrNull();
        if (!sb) {
          if (!alive) return;
          setTotalChapters(0);
          setVersesState([]);
          setLoadError('Bíblia indisponível (Supabase não configurado neste build).');
          setLoading(false);
          return;
        }

        const versionId = await resolveVersionId(versionCode);

        const { data, error } = await sb
          .from('bible_verses')
          .select('chapter')
          .eq('version_id', versionId)
          .eq('book', bookId)
          .order('chapter', { ascending: false })
          .limit(1);

        if (!alive) return;

        if (error) {
          console.log('LOAD_TOTAL_CHAPTERS_ERROR', error);
          setTotalChapters(0);
        } else {
          const maxChapter = Number(data?.[0]?.chapter) || 0;
          setTotalChapters(maxChapter);
        }
      } catch (e) {
        console.log('LOAD_TOTAL_CHAPTERS_FATAL', e);
        if (!alive) return;
        setTotalChapters(0);
      }
    }

    void loadTotal();

    return () => {
      alive = false;
    };
  }, [bookId, isValidBook, versionCode]);

  useEffect(() => {
    let alive = true;

    async function loadVerses() {
      setLoading(true);

      if (!isValidBook) {
        setTotalChapters(0);
        setVersesState([]);
        setLoadError('Livro não informado.');
        setLoading(false);
        return;
      }

      try {
        const sb = getSupabaseOrNull();
        if (!sb) {
          if (!alive) return;
          setTotalChapters(0);
          setVersesState([]);
          setLoadError('Bíblia indisponível (Supabase não configurado neste build).');
          setLoading(false);
          return;
        }

        const versionId = await resolveVersionId(versionCode);

        const { data, error } = await sb
          .from('bible_verses')
          .select('id, verse, text')
          .eq('version_id', versionId)
          .eq('book', bookId)
          .eq('chapter', chapterNum)
          .order('verse', { ascending: true });

        if (!alive) return;

        if (error) {
          console.log('LOAD_VERSES_ERROR', error);
          setVersesState([]);
          setLoadError('Não foi possível carregar o capítulo. Verifique sua conexão e tente novamente.');
        } else {
          setVersesState((data as Verse[]) ?? []);
          setLoadError(null);
        }
      } catch (e) {
        console.log('LOAD_VERSES_FATAL', e);
        if (!alive) return;
        setVersesState([]);
        setLoadError('Não foi possível carregar o capítulo. Verifique sua conexão e tente novamente.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadVerses();

    return () => {
      alive = false;
    };
  }, [isValidBook, bookId, chapterNum, versionCode]);

  const goBackSmart = useCallback(() => {
    if (returnToStr) {
      router.replace(returnToStr as never);
      return;
    }

    router.replace('/(tabs)/read' as never);
  }, [router, returnToStr]);

  const callAI = useCallback(
    async (
      prompt: string,
      title: string,
      reference: string,
      verseNumber?: number | null,
      mode: 'chapter' | 'verse' = 'chapter',
    ) => {
      setAiTitle(title);
      setSaveReference(reference);
      setSaveVerse(verseNumber ?? null);
      setAnalysisData(null);
      setRawAi('');
      setAiOpen(true);
      setAiLoading(true);

      const analysisLanguage = getAnalysisLanguage(versionCode) as
        | 'pt'
        | 'es'
        | 'ja'
        | 'en';

      const SYSTEM =
        analysisLanguage === 'pt'
          ? mode === 'chapter'
            ? `
VOICE:
Você é a maior autoridade mundial em Estudos Bíblicos, PhD em Linguística Bíblica (Hebraico, Aramaico e Grego), Arqueologia do Antigo Oriente Próximo, História do Judaísmo e Cristianismo Primitivo, e Teologia Sistemática Reformada.
Você escreve como um professor de seminário veterano, erudito, reverente, pastoral e profundamente analítico.

TASK:
Analise o capítulo bíblico solicitado e retorne um comentário bíblico PROFUNDO, DETALHADO, ERUDITO e PASTORAL em formato JSON válido.

RULES:
1. SEJA PROLIXO E PROFUNDO.
2. RETORNE APENAS JSON VÁLIDO.
3. TODOS OS CAMPOS DEVEM SER TEXTO CORRIDO (strings).
4. ANALISE O CAPÍTULO COMO UMA UNIDADE LITERÁRIA COMPLETA.
5. NÃO SEJA SUPERFICIAL.
6. SEM MARKDOWN.
7. SEM TEXTO FORA DO JSON.
8. QUANDO RELEVANTE, CITE TERMOS NO ORIGINAL.
9. CONECTE O CAPÍTULO AO CONTEXTO DO LIVRO, À HISTÓRIA DA REDENÇÃO E À TEOLOGIA BÍBLICA.
10. ESCREVA COM TOM DE COMENTÁRIO BÍBLICO AVANÇADO, MAS COM CLAREZA PASTORAL.

ESTRUTURA JSON:
{
  "theme": "",
  "history": "",
  "culture": "",
  "exegesis": "",
  "theology": "",
  "application": ""
}
`.trim()
            : `
VOICE:
Você é a maior autoridade mundial em Estudos Bíblicos, PhD em Linguística Bíblica (Hebraico, Aramaico e Grego), Arqueologia Bíblica, Exegese, Hermenêutica e Teologia Sistemática Reformada.
Você escreve como um exegeta de alto nível, com precisão acadêmica, reverência bíblica e clareza pastoral.

TASK:
Analise o versículo bíblico solicitado e retorne uma exegese PROFUNDA, DETALHADA, TÉCNICA e TEOLOGICAMENTE ROBUSTA em formato JSON válido.

RULES:
1. SEJA PROFUNDO, PRECISO E DETALHADO.
2. RETORNE APENAS JSON VÁLIDO.
3. TODOS OS CAMPOS DEVEM SER TEXTO CORRIDO (strings).
4. FOQUE NO VERSÍCULO, MAS SEM IGNORAR O CONTEXTO IMEDIATO E O CONTEXTO DO LIVRO.
5. SEM MARKDOWN.
6. SEM TEXTO FORA DO JSON.
7. QUANDO RELEVANTE, CITE TERMOS NO ORIGINAL.
8. EXPLIQUE O SENTIDO DO TEXTO COM RIGOR HERMENÊUTICO.
9. EVITE DEVOCIONALISMO SUPERFICIAL.
10. CONECTE O VERSÍCULO COM A TEOLOGIA BÍBLICA E SISTEMÁTICA.

ESTRUTURA JSON:
{
  "theme": "",
  "history": "",
  "culture": "",
  "exegesis": "",
  "theology": "",
  "application": ""
}
`.trim()
          : analysisLanguage === 'es'
            ? `
Eres un especialista en Teología Bíblica, lenguas originales, historia bíblica y exégesis.
Responde EXCLUSIVAMENTE con JSON válido y TODO el contenido debe estar en español.
Sin markdown y sin texto fuera del JSON.
La estructura JSON debe contener exactamente:
{
  "theme": "",
  "history": "",
  "culture": "",
  "exegesis": "",
  "theology": "",
  "application": ""
}
Escribe con profundidad real, tono erudito y claridad pastoral.
`.trim()
            : analysisLanguage === 'ja'
              ? `
あなたは聖書神学、原語学、聖書史、釈義学の専門家です。
必ず有効なJSONのみで回答し、内容はすべて自然な日本語で書いてください。
MarkdownやJSON以外の文章は禁止です。
JSONの構造は必ず次の6項目です:
{
  "theme": "",
  "history": "",
  "culture": "",
  "exegesis": "",
  "theology": "",
  "application": ""
}
深い学術性と牧会的明瞭さを両立してください。
日本語以外を混ぜないでください。
`.trim()
              : `
You are a specialist in Biblical Theology, original languages, biblical history, and exegesis.
Respond EXCLUSIVELY with valid JSON and ALL content must be in English.
No markdown and no text outside the JSON.
The JSON structure must contain exactly:
{
  "theme": "",
  "history": "",
  "culture": "",
  "exegesis": "",
  "theology": "",
  "application": ""
}
Write with real depth, scholarly tone, and pastoral clarity.
`.trim();

      try {
        const url =
          Platform.OS === 'web' ? '/api/chat' : `${API_BASE_URL}/api/chat`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user', content: prompt },
            ],
          }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { error?: string })?.error || `HTTP ${res.status}`);
        }

        const content: string =
          (body as any)?.choices?.[0]?.message?.content ??
          (body as any)?.output_text ??
          '';

        const maybeJson = extractJsonObject(String(content));

        if (maybeJson) {
          try {
            const parsed = JSON.parse(maybeJson);
            setAnalysisData({
              theme: parsed.theme,
              history: parsed.history,
              culture: parsed.culture,
              exegesis: parsed.exegisis ?? parsed.exegesis,
              theology: parsed.theology,
              application: parsed.application,
            });
          } catch {
            setRawAi(String(content));
          }
        } else {
          setRawAi(String(content));
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'não foi possível consultar a IA';

        setRawAi(`Erro: ${message}`);
      } finally {
        setAiLoading(false);
      }
    },
    [versionCode],
  );

  const analyzeChapter = useCallback(() => {
    const language = getAnalysisLanguage(versionCode) as 'pt' | 'es' | 'ja' | 'en';

    void callAI(
      buildChapterPrompt(language, safeBookName, chapterNum),
      `Análise — ${safeBookName} ${chapterNum}`,
      `${safeBookName} ${chapterNum} (${versionCode})`,
      null,
      'chapter',
    );
  }, [callAI, chapterNum, safeBookName, versionCode]);

  const analyzeVerse = useCallback(
    (v: Verse) => {
      const language = getAnalysisLanguage(versionCode) as 'pt' | 'es' | 'ja' | 'en';

      void callAI(
        buildVersePrompt(language, v.text, safeBookName, chapterNum, v.verse),
        `Exegese — ${safeBookName} ${chapterNum}:${v.verse}`,
        `${safeBookName} ${chapterNum}:${v.verse} (${versionCode})`,
        v.verse,
        'verse',
      );
    },
    [callAI, chapterNum, safeBookName, versionCode],
  );

  const handleOpenProjector = useCallback(async () => {
    try {
      const safeVerses = versesState
        .map((item) => ({
          verse: Number(item.verse),
          text: String(item.text || '').trim(),
        }))
        .filter((item) => Number.isFinite(item.verse) && item.verse > 0 && item.text.length > 0);

      if (!safeBookName.trim()) {
        Alert.alert('Projetor', 'Livro inválido para projeção.');
        return;
      }

      if (!Number.isFinite(chapterNum) || chapterNum <= 0) {
        Alert.alert('Projetor', 'Capítulo inválido para projeção.');
        return;
      }

      if (safeVerses.length === 0) {
        Alert.alert('Projetor', 'Nenhum versículo carregado para projetar.');
        return;
      }

      await openBibleProjector({
        router,
        bookLabel: safeBookName,
        chapter: chapterNum,
        verses: safeVerses,
      });
    } catch (error) {
      console.log('OPEN_BIBLE_PROJECTOR_ERROR', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível abrir o projetor.';

      Alert.alert('Erro no projetor', message);
    }
  }, [chapterNum, router, safeBookName, versesState]);

  async function handleSaveAI() {
    if (!analysisData && !rawAi) return;

    setSaving(true);

    try {
      const sb = getSupabaseOrNull();

      if (!sb) {
        Alert.alert('Supabase', 'Supabase não configurado neste build.');
        return;
      }

      const { data: sessionData, error: sessionErr } = await sb.auth.getSession();

      if (sessionErr) {
        console.log('AUTH_GET_SESSION_ERROR', sessionErr);
        throw sessionErr;
      }

      const user = sessionData.session?.user;

      if (!user) {
        Alert.alert('Login necessário', 'Faça login para salvar.', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ir para login',
            onPress: () => router.push('/(auth)/login' as never),
          },
        ]);
        return;
      }

      const envelope = buildAnalysisEnvelope({
        bookId,
        chapter: chapterNum,
        verse: saveVerse,
        label: saveReference || '',
        title: aiTitle || 'Análise',
        analysisData,
        rawAi,
      });

      const payload = {
        user_id: user.id,
        title: aiTitle || 'Análise',
        reference: saveReference || '',
        content: JSON.stringify(envelope),
      };

      const { data, error } = await sb
        .from('saved_notes')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.log('SAVE_NOTE_ERROR', error);
        Alert.alert(
          'Erro ao salvar',
          `${error.message}\n(code: ${(error as { code?: string }).code ?? '-'})`,
        );
        return;
      }

      console.log('SAVED_NOTE_ID', data?.id);
      Alert.alert('Salvo', 'Análise salva em Meus Estudos.');
    } catch (e) {
      console.log('HANDLE_SAVE_AI_FATAL', e);

      const message = e instanceof Error ? e.message : 'Falha inesperada.';
      Alert.alert('Erro ao salvar', message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!initialVerse || versesState.length === 0) return;

    const idx = versesState.findIndex((v) => v.verse === initialVerse);
    if (idx < 0) return;

    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: idx,
        animated: true,
        viewPosition: 0.25,
      });
    }, 250);

    return () => clearTimeout(t);
  }, [initialVerse, versesState]);

  const canPrev = chapterNum > 1;
  const canNext = totalChapters > 0 && chapterNum < totalChapters;

  const goPrev = useCallback(() => {
    if (canPrev) setChapterNum((c) => c - 1);
  }, [canPrev]);

  const goNext = useCallback(() => {
    if (canNext) setChapterNum((c) => c + 1);
  }, [canNext]);

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => (
      <TouchableOpacity activeOpacity={0.9} onLongPress={() => analyzeVerse(item)}>
        <Text
          style={[
            styles.verse,
            {
              fontSize,
              lineHeight: Math.round(fontSize * 1.6),
              color: colors.text,
            },
          ]}
        >
          <Text
            style={[
              styles.verseNumber,
              {
                fontSize: Math.round(fontSize * 0.75),
                color: colors.primary,
              },
            ]}
          >
            {item.verse}{' '}
          </Text>
          {item.text}
        </Text>
      </TouchableOpacity>
    ),
    [analyzeVerse, colors.primary, colors.text, fontSize],
  );

  if (!isValidBook) {
    return (
      <SafeAreaView style={styles.centerSafe} edges={['top', 'bottom']}>
        <Text style={styles.centerTitle}>Livro não informado</Text>
        <Text style={styles.centerText}>
          Essa tela precisa abrir com um livro (ex: /read/1). Volte e selecione um livro.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/read' as never)} style={styles.centerBtn}>
          <Text style={styles.centerBtnText}>Ir para a lista de livros</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={goBackSmart}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>
                Voltar
              </Text>
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <TouchableOpacity onPress={() => setShowChapters(true)} style={styles.headerTitleContainer}>
             <Text style={[styles.headerTitleText, { color: colors.text }]} numberOfLines={1}>
  {safeBookName} {chapterNum}{' '}
  <Text style={{ color: colors.muted }}>▼</Text>
</Text>
            </TouchableOpacity>
          ),
          headerRight: () => null,
        }}
      />

      <View
  style={[
    styles.topActionBar,
    {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
  ]}
>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topActionBarContent}
        >
          <TouchableOpacity onPress={() => setShowVersions(true)} style={[styles.actionChip, { backgroundColor: colors.chip }]}>
            <Text style={styles.actionChipVersion}>{versionCode}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={analyzeChapter} style={[styles.actionChip, { backgroundColor: colors.chip }]}>
            <Ionicons name="school-outline" size={18} color="#AF52DE" />
            <Text style={[styles.actionChipText, { color: colors.chipText }]}>IA</Text>
          </TouchableOpacity>

          {isWeb ? (
            <TouchableOpacity
              onPress={() => void handleOpenProjector()}
              style={[styles.actionChip, { backgroundColor: colors.chip }]}
            >
             <Ionicons name="tv-outline" size={18} color={colors.chipText} />
              <Text style={[styles.actionChipText, { color: colors.chipText }]}>Projetor</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => setFontSize((p) => clamp(p - 2, 12, 40))}
            style={[styles.actionChip, { backgroundColor: colors.chip }]}
          >
           <Text style={[styles.actionChipText, { color: colors.chipText }]}> A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFontSize((p) => clamp(p + 2, 12, 40))}
            style={[styles.actionChip, { backgroundColor: colors.chip }]}
          >
            <Text style={[styles.actionChipText, { color: colors.chipText }]}>A+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : (
          <>
            {loadError ? (
              <Text style={{ color: '#D70015', textAlign: 'center', paddingHorizontal: 18, paddingTop: 10 }}>
                {loadError}
              </Text>
            ) : null}

            <FlatList
              ref={listRef}
              data={versesState}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={[
                styles.list,
                { paddingBottom: 20 + Math.max(insets.bottom, 0) + 62 },
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={renderVerse}
              onScrollToIndexFailed={() => {
                setTimeout(
                  () => listRef.current?.scrollToOffset({ offset: 0, animated: true }),
                  150,
                );
              }}
            />
          </>
        )}
      </View>

      <View
  style={[
    styles.bottomWrap,
    {
      paddingBottom: Math.max(insets.bottom, 10),
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
    },
  ]}
>
        <View style={styles.bottomBar}>
          <TouchableOpacity
           style={[
            styles.navBtn,
            !canPrev && { backgroundColor: colors.cardSoft },
          ]}
            onPress={goPrev}
            disabled={!canPrev}
          >
            <Ionicons name="chevron-back" size={18} color={!canPrev ? '#bbb' : '#fff'} />
            <Text style={[styles.navText, !canPrev && styles.navTextDisabled]}> Anterior</Text>
          </TouchableOpacity>

          <Text style={[styles.counterText, { color: colors.text }]}>
            {chapterNum} / {totalChapters || '—'}
          </Text>

          <TouchableOpacity
            style={[styles.navBtn, !canNext && { backgroundColor: colors.cardSoft }, styles.navBtnDisabled ]}
            onPress={goNext}
            disabled={!canNext}
          >
            <Text style={[styles.navText, !canNext && styles.navTextDisabled]}>Próximo </Text>
            <Ionicons name="chevron-forward" size={18} color={!canNext ? '#bbb' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showChapters} animationType="slide" onRequestClose={() => setShowChapters(false)}>
        <SafeAreaView style={[styles.modal, { paddingTop: Math.max(insets.top, 12) }]} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Capítulos — {safeBookName}</Text>
            <TouchableOpacity onPress={() => setShowChapters(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.chapterGrid}>
            {Array.from({ length: totalChapters || 1 }, (_, i) => i + 1).map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chapterBtn, c === chapterNum && styles.chapterActive]}
                onPress={() => {
                  setChapterNum(c);
                  setShowChapters(false);
                }}
              >
                <Text style={[styles.chapterText, c === chapterNum && styles.chapterActiveText]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showVersions} animationType="slide" onRequestClose={() => setShowVersions(false)}>
        <SafeAreaView style={[styles.modal, { paddingTop: Math.max(insets.top, 12) }]} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Versões</Text>
            <TouchableOpacity onPress={() => setShowVersions(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.versionList}>
            {versions.map((v) => (
              <TouchableOpacity
                key={v.code}
                style={[styles.versionBtn, v.code === versionCode && styles.versionActive]}
                onPress={() => {
                  setVersionCode(v.code);
                  setShowVersions(false);
                }}
              >
                <Text style={[styles.versionCode, v.code === versionCode && styles.versionActiveText]}>
                  {v.code}
                </Text>
                <Text style={[styles.versionName, v.code === versionCode && styles.versionActiveText]}>
                  {v.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={aiOpen} animationType="slide" onRequestClose={() => setAiOpen(false)}>
        <SafeAreaView style={[styles.aiSafe, { paddingTop: Math.max(insets.top, 12) }]} edges={['top', 'bottom']}>
          <View style={styles.aiHeader}>
            <TouchableOpacity onPress={() => setAiOpen(false)} style={styles.aiHeaderBtn}>
              <Text style={styles.aiHeaderText}>Fechar</Text>
            </TouchableOpacity>

            <Text style={styles.aiHeaderTitle} numberOfLines={1}>
              {aiTitle}
            </Text>

            <TouchableOpacity onPress={handleSaveAI} disabled={saving || aiLoading} style={styles.saveBtn}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {aiLoading ? (
            <View style={styles.aiLoading}>
              <ActivityIndicator size="large" color="#AF52DE" />
              <Text style={{ marginTop: 12, color: '#666' }}>Consultando…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.aiBody}>
              <Text style={styles.aiSubject}>{saveReference}</Text>

              {analysisData ? (
                <>
                  <InfoCard title="TEMA CENTRAL" icon="bookmark" color="#1C1C1E" text={analysisData.theme} />
                  <InfoCard title="CONTEXTO HISTÓRICO" icon="time" color="#FF9500" text={analysisData.history} />
                  <InfoCard title="CONTEXTO CULTURAL" icon="people" color="#8E44AD" text={analysisData.culture} />
                  <InfoCard title="EXEGESE & LINGUÍSTICA" icon="search" color="#007AFF" text={analysisData.exegesis} />
                  <InfoCard title="TEOLOGIA" icon="book" color="#AF52DE" text={analysisData.theology} />
                  <InfoCard title="APLICAÇÃO PRÁTICA" icon="leaf" color="#34C759" text={analysisData.application} />
                  <Text style={styles.aiHint}>* Dica: segure um versículo para exegese do versículo.</Text>
                </>
              ) : (
                <View style={styles.rawBox}>
                  <Text style={styles.rawText}>{rawAi || 'Sem resposta.'}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  headerTitleContainer: {
    maxWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: { fontSize: 17, fontWeight: '900' },

  topActionBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },

  topActionBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
  },

  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  actionChipText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },

  actionChipVersion: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
  },

  list: { paddingHorizontal: 20, paddingTop: 20 },
  verse: { marginBottom: 14, color: '#222', textAlign: 'justify' },
  verseNumber: { fontWeight: '900', color: '#007AFF' },

  bottomWrap: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  navBtn: {
    minWidth: 112,
    backgroundColor: '#007AFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBtnDisabled: {
    backgroundColor: '#F2F2F7',
  },

  navText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },

  navTextDisabled: {
    color: '#bbb',
  },

  counterText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
  },

  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },

  modalClose: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '900',
  },

  chapterGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 14, paddingBottom: 30 },

  chapterBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },

  chapterActive: { backgroundColor: '#007AFF' },
  chapterText: { fontSize: 16, fontWeight: '900', color: '#111' },
  chapterActiveText: { color: '#fff' },

  versionList: {
    padding: 16,
    paddingBottom: 30,
  },

  versionBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  versionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  versionCode: {
    color: '#111',
    fontSize: 15,
    fontWeight: '900',
  },

  versionName: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },

  versionActiveText: {
    color: '#fff',
  },

  aiSafe: { flex: 1, backgroundColor: '#F2F2F7' },

  aiHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  aiHeaderBtn: { paddingVertical: 6, paddingRight: 10 },
  aiHeaderText: { color: '#007AFF', fontSize: 16, fontWeight: '900' },

  aiHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    paddingHorizontal: 10,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },

  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  aiLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  aiBody: { padding: 16, paddingBottom: 30 },
  aiSubject: { textAlign: 'center', fontSize: 18, fontWeight: '900', marginBottom: 14, color: '#111' },
  aiHint: { marginTop: 10, fontSize: 12, color: '#8E8E93', textAlign: 'center' },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  infoBar: { width: 5 },
  infoContent: { flex: 1, padding: 14, paddingVertical: 16 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  infoText: { fontSize: 15, lineHeight: 22, color: '#333', textAlign: 'justify' },

  rawBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  rawText: { fontSize: 15, lineHeight: 22, color: '#222' },

  centerSafe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },

  centerTitle: { fontSize: 18, fontWeight: '900', marginBottom: 10, color: '#111' },
  centerText: { color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  centerBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  centerBtnText: { color: '#fff', fontWeight: '900' },
});