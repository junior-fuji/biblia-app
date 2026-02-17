import { getSupabaseOrNull } from '@/lib/supabaseClient';

type Verse = { id: number; verse: number; text_pt: string };

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
  exegesis?: string;
  theology?: string;
  application?: string;
};

const BOOK_MAP: Record<number, { name: string; abbrev: string }> = {
  1: { name: 'Gênesis', abbrev: 'Gn' }, 2: { name: 'Êxodo', abbrev: 'Êx' },
  3: { name: 'Levítico', abbrev: 'Lv' }, 4: { name: 'Números', abbrev: 'Nm' },
  5: { name: 'Deuteronômio', abbrev: 'Dt' }, 6: { name: 'Josué', abbrev: 'Js' },
  7: { name: 'Juízes', abbrev: 'Jz' }, 8: { name: 'Rute', abbrev: 'Rt' },
  9: { name: '1 Samuel', abbrev: '1Sm' }, 10: { name: '2 Samuel', abbrev: '2Sm' },
  11: { name: '1 Reis', abbrev: '1Rs' }, 12: { name: '2 Reis', abbrev: '2Rs' },
  13: { name: '1 Crônicas', abbrev: '1Cr' }, 14: { name: '2 Crônicas', abbrev: '2Cr' },
  15: { name: 'Esdras', abbrev: 'Ed' }, 16: { name: 'Neemias', abbrev: 'Ne' },
  17: { name: 'Ester', abbrev: 'Et' }, 18: { name: 'Jó', abbrev: 'Jó' },
  19: { name: 'Salmos', abbrev: 'Sl' }, 20: { name: 'Provérbios', abbrev: 'Pv' },
  21: { name: 'Eclesiastes', abbrev: 'Ec' }, 22: { name: 'Cânticos', abbrev: 'Ct' },
  23: { name: 'Isaías', abbrev: 'Is' }, 24: { name: 'Jeremias', abbrev: 'Jr' },
  25: { name: 'Lamentações', abbrev: 'Lm' }, 26: { name: 'Ezequiel', abbrev: 'Ez' },
  27: { name: 'Daniel', abbrev: 'Dn' }, 28: { name: 'Oseias', abbrev: 'Os' },
  29: { name: 'Joel', abbrev: 'Jl' }, 30: { name: 'Amós', abbrev: 'Am' },
  31: { name: 'Obadias', abbrev: 'Ob' }, 32: { name: 'Jonas', abbrev: 'Jn' },
  33: { name: 'Miqueias', abbrev: 'Mq' }, 34: { name: 'Naum', abbrev: 'Na' },
  35: { name: 'Habacuque', abbrev: 'Hc' }, 36: { name: 'Sofonias', abbrev: 'Sf' },
  37: { name: 'Ageu', abbrev: 'Ag' }, 38: { name: 'Zacarias', abbrev: 'Zc' },
  39: { name: 'Malaquias', abbrev: 'Ml' }, 40: { name: 'Mateus', abbrev: 'Mt' },
  41: { name: 'Marcos', abbrev: 'Mc' }, 42: { name: 'Lucas', abbrev: 'Lc' },
  43: { name: 'João', abbrev: 'Jo' }, 44: { name: 'Atos', abbrev: 'At' },
  45: { name: 'Romanos', abbrev: 'Rm' }, 46: { name: '1 Coríntios', abbrev: '1Co' },
  47: { name: '2 Coríntios', abbrev: '2Co' }, 48: { name: 'Gálatas', abbrev: 'Gl' },
  49: { name: 'Efésios', abbrev: 'Ef' }, 50: { name: 'Filipenses', abbrev: 'Fp' },
  51: { name: 'Colossenses', abbrev: 'Cl' }, 52: { name: '1 Tessalonicenses', abbrev: '1Ts' },
  53: { name: '2 Tessalonicenses', abbrev: '2Ts' }, 54: { name: '1 Timóteo', abbrev: '1Tm' },
  55: { name: '2 Timóteo', abbrev: '2Tm' }, 56: { name: 'Tito', abbrev: 'Tt' },
  57: { name: 'Filemom', abbrev: 'Fm' }, 58: { name: 'Hebreus', abbrev: 'Hb' },
  59: { name: 'Tiago', abbrev: 'Tg' }, 60: { name: '1 Pedro', abbrev: '1Pe' },
  61: { name: '2 Pedro', abbrev: '2Pe' }, 62: { name: '1 João', abbrev: '1Jo' },
  63: { name: '2 João', abbrev: '2Jo' }, 64: { name: '3 João', abbrev: '3Jo' },
  65: { name: 'Judas', abbrev: 'Jd' }, 66: { name: 'Apocalipse', abbrev: 'Ap' },
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

function InfoCard({
  title,
  text,
  color,
  icon,
}: {
  title: string;
  text?: string;
  color: string;
  icon: any;https://biblia
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

  const { book, chapter, verse, returnTo } = useLocalSearchParams<RouteParams>();
  const bookId = Number(book);
  const returnToStr = typeof returnTo === 'string' ? returnTo : undefined;

  const initialChapter = useMemo(() => {
    const c = chapter ? Number(chapter) : 1;
    return Number.isFinite(c) && c > 0 ? c : 1;
  }, [chapter]);

  const initialVerse = useMemo(() => {
    const v = verse ? Number(verse) : NaN;
    return Number.isFinite(v) && v > 0 ? v : undefined;
  }, [verse]);

  // Se abrir sem book, NÃO TRAVA.
  if (!book || !Number.isFinite(bookId)) {
    return (
      <SafeAreaView style={styles.centerSafe} edges={['top', 'bottom']}>
        <Text style={styles.centerTitle}>Livro não informado</Text>
        <Text style={styles.centerText}>
          Essa tela precisa abrir com um livro (ex: /read/1). Volte e selecione um livro.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/read' as any)} style={styles.centerBtn}>
          <Text style={styles.centerBtnText}>Ir para a lista de livros</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const bookData = BOOK_MAP[bookId] ?? { name: 'Livro', abbrev: '' };
  const safeBookName = bookData.name || 'Livro';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [chapterNum, setChapterNum] = useState<number>(initialChapter);
  const [totalChapters, setTotalChapters] = useState(0);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [showChapters, setShowChapters] = useState(false);
  const [fontSize, setFontSize] = useState(20);

  // IA modal
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [rawAi, setRawAi] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveReference, setSaveReference] = useState<string>('');

  // Mantém chapterNum sincronizado com URL (sem loop)
  useEffect(() => {
    setChapterNum((current) => (current !== initialChapter ? initialChapter : current));
  }, [initialChapter]);

  // Descobre total de capítulos
  useEffect(() => {
    let alive = true;

    async function loadTotal() {
      try {
        const sb = getSupabaseOrNull();
        setLoading(false);
return;

if (!sb) {
  // não crasha: só marca erro/carrega vazio
  setTotalChapters(0);
  setVerses([]);
  setLoadError('Bíblia indisponível no momento (Supabase não configurado neste build).');
  setLoading(false);
  return;
}

        const { data, error } = await sb
          .from('verses')
          .select('chapter')
          .eq('book_id', bookId)
          .order('chapter', { ascending: false })
          .limit(1);

        if (!alive) return;

        if (!error && data && data.length > 0 && Number.isFinite(Number((data as any)[0].chapter))) {
          const max = Number((data as any)[0].chapter);
          setTotalChapters((prev) => (prev !== max ? max : prev));
          setChapterNum((prev) => clamp(prev, 1, max));
        } else {
          setTotalChapters(0);
        }
      } catch (e) {
        if (!alive) return;
        setTotalChapters(0);
      }
    }

    if (!sb) {
      if (!alive) return;
      setTotalChapters(0);
      setVerses([]);
      setLoadError('Bíblia indisponível no momento (Supabase não configurado neste build).');
      setLoading(false);
      return;
    }
    

  // Carrega versículos do capítulo
  useEffect(() => {
    let alive = true;

    async function loadVerses() {
      setLoading(true);
      setLoadError(null);

      try {
        const sb = getSupabaseOrNull();
        if (!sb) {
          // não crasha: só marca erro/carrega vazio
          setTotalChapters(0);
          setVerses([]);
          setLoadError('Bíblia indisponível no momento (Supabase não configurado neste build).');
          setLoading(false);
          return;
        }
        
        const { data, error } = await sb
          .from('verses')
          .select('id, verse, text_pt')
          .eq('book_id', bookId)
          .eq('chapter', chapterNum)
          .order('verse', { ascending: true });

        if (!alive) return;

        if (error) {
          setVerses([]);
          setLoadError('Não foi possível carregar o capítulo. Verifique sua conexão e tente novamente.');
        } else {
          setVerses((data as Verse[]) ?? []);
          setLoadError(null);
        }
      } catch (e) {
        if (!alive) return;
        setVerses([]);
        setLoadError('Não foi possível carregar o capítulo. Verifique sua conexão e tente novamente.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadVerses();
    return () => {
      alive = false;
    };
  }, [bookId, chapterNum]);

  // Voltar inteligente: Search/Plan -> volta para onde veio (returnTo)
  const goBackSmart = useCallback(() => {
    if (returnToStr) {
      router.replace(returnToStr as any);
      return;
    }
    router.replace('/(tabs)/read' as any);
  }, [router, returnToStr]);

  async function callAI(prompt: string, title: string, reference: string) {
    setAiTitle(title);
    setSaveReference(reference);
    setAnalysisData(null);
    setRawAi('');
    setAiOpen(true);
    setAiLoading(true);

    const SYSTEM = `
Você é um especialista em Teologia Bíblica e línguas originais (hebraico/aramaico/grego).
Responda EXCLUSIVAMENTE com JSON válido (sem markdown, sem texto fora do JSON).
Estrutura obrigatória:
{
  "theme": "Tema central com profundidade",
  "history": "Contexto histórico (autor, data, geografia, cenário)",
  "exegesis": "Exegese e nuances do original (hebraico/grego), com termos quando pertinente",
  "theology": "Conexões bíblicas e implicações teológicas",
  "application": "Aplicação pastoral prática"
}
Se não souber algum campo, preencha com string curta explicando a limitação.
`.trim();

    try {
      const url = Platform.OS === 'web' ? '/api/chat' : `${API_BASE_URL}/api/chat`;

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
      if (!res.ok) throw new Error((body as any)?.error || `HTTP ${res.status}`);

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
    } catch (e: any) {
      setRawAi(`Erro: ${e?.message || 'não foi possível consultar a IA'}`);
    } finally {
      setAiLoading(false);
    }
  }

  const analyzeChapter = useCallback(() => {
    callAI(
      `Analise profundamente ${safeBookName} capítulo ${chapterNum}. Foque em contexto histórico, nuances do original (hebraico/grego) e aplicação pastoral.`,
      `Análise — ${safeBookName} ${chapterNum}`,
      `${safeBookName} ${chapterNum}`
    );
  }, [safeBookName, chapterNum]);

  const analyzeVerse = useCallback(
    (v: Verse) => {
      callAI(
        `Faça exegese profunda do versículo: "${v.text_pt}" (referência: ${safeBookName} ${chapterNum}:${v.verse}). Explique nuances do original e implicações teológicas.`,
        `Exegese — ${safeBookName} ${chapterNum}:${v.verse}`,
        `${safeBookName} ${chapterNum}:${v.verse}`
      );
    },
    [safeBookName, chapterNum]
  );

  const sb = getSupabaseOrNull();
if (!sb) {
  Alert.alert('Supabase', 'Supabase não configurado neste build.');
  return;
}
const { error } = await sb.from('saved_notes').insert({
  title: aiTitle || 'Análise',
  reference: saveReference,
  content: contentToSave,
});



    setSaving(true);
    try {
      const contentToSave = analysisData ? JSON.stringify(analysisData) : rawAi;

      const sb = getSupabaseOrNull();
if (!sb) {
  Alert.alert('Supabase', 'Supabase não configurado neste build.');
  return;
}

      const { error } = await sb.from('saved_notes').insert({
        title: aiTitle || 'Análise',
        reference: saveReference,
        content: contentToSave,
      });

      if (error) {
        Alert.alert('Erro ao salvar', error.message);
        return;
      }

      Alert.alert('Salvo', 'Análise salva em Meus Estudos.');
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message || 'Falha inesperada.');
    } finally {
      setSaving(false);
    }
  }

  // Quando carregar verses: rola até o versículo alvo, se veio via Search/Plan
  useEffect(() => {
    if (!initialVerse || verses.length === 0) return;

    const idx = verses.findIndex((v) => v.verse === initialVerse);
    if (idx < 0) return;

    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.25 });
    }, 250);

    return () => clearTimeout(t);
  }, [initialVerse, verses]);

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
        <Text style={[styles.verse, { fontSize, lineHeight: Math.round(fontSize * 1.6) }]}>
          <Text style={[styles.verseNumber, { fontSize: Math.round(fontSize * 0.75) }]}>
            {item.verse}{' '}
          </Text>
          {item.text_pt}
        </Text>
      </TouchableOpacity>
    ),
    [analyzeVerse, fontSize]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={goBackSmart}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color="#007AFF" />
              <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '900' }}>Voltar</Text>
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <TouchableOpacity onPress={() => setShowChapters(true)} style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleText}>
                {safeBookName} {chapterNum} <Text style={{ color: '#8e8e93' }}>▼</Text>
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity onPress={analyzeChapter} style={styles.headerIconBtn}>
                <Ionicons name="school-outline" size={22} color="#AF52DE" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFontSize((p) => clamp(p - 2, 12, 40))}
                style={styles.headerIconBtn}
              >
                <Ionicons name="remove" size={22} color="#007AFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFontSize((p) => clamp(p + 2, 12, 40))}
                style={styles.headerIconBtn}
              >
                <Ionicons name="add" size={22} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : (
          <>
            {loadError && (
              <Text style={{ color: '#D70015', textAlign: 'center', paddingHorizontal: 18, paddingTop: 10 }}>
                {loadError}
              </Text>
            )}

            <FlatList
              ref={listRef}
              data={verses}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={[
                styles.list,
                { paddingBottom: 20 + Math.max(insets.bottom, 0) + 62 },
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={renderVerse}
              onScrollToIndexFailed={() => {
                setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 150);
              }}
            />
          </>
        )}
      </View>

      {/* Barra inferior */}
      <View style={[styles.bottomWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.navBtn, !canPrev && styles.navBtnDisabled]}
            onPress={goPrev}
            disabled={!canPrev}
          >
            <Ionicons name="chevron-back" size={18} color={!canPrev ? '#bbb' : '#fff'} />
            <Text style={[styles.navText, !canPrev && styles.navTextDisabled]}> Anterior</Text>
          </TouchableOpacity>

          <Text style={styles.counterText}>
            {chapterNum} / {totalChapters || '—'}
          </Text>

          <TouchableOpacity
            style={[styles.navBtn, !canNext && styles.navBtnDisabled]}
            onPress={goNext}
            disabled={!canNext}
          >
            <Text style={[styles.navText, !canNext && styles.navTextDisabled]}>Próximo </Text>
            <Ionicons name="chevron-forward" size={18} color={!canNext ? '#bbb' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Capítulos */}
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
                <Text style={[styles.chapterText, c === chapterNum && styles.chapterActiveText]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal IA */}
      <Modal visible={aiOpen} animationType="slide" onRequestClose={() => setAiOpen(false)}>
        <SafeAreaView style={styles.aiSafe} edges={['top', 'bottom']}>
          <View style={[styles.aiHeader, { paddingTop: Math.max(insets.top, 12) }]}>
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

/* =========================
   STYLES

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitleText: { fontSize: 17, fontWeight: '900' },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { paddingHorizontal: 8, paddingVertical: 6 },

  list: { paddingHorizontal: 20, paddingTop: 20 },
  verse: { marginBottom: 14, color: '#222', textAlign: 'justify' },
  verseNumber: { fontWeight: '900', color: '#007AFF' },

  bottomWrap: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  navBtnDisabled: { backgroundColor: '#f1f1f1' },
  navText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  navTextDisabled: { color: '#bbb' },
  counterText: { color: '#666', fontSize: 13, fontWeight: '800' },

  modal: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 16, fontWeight: '900' },
  modalClose: { color: '#007AFF', fontSize: 16, fontWeight: '900' },

  chapterGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 14, paddingBottom: 30 },
  chapterBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', margin: 8 },
  chapterActive: { backgroundColor: '#007AFF' },
  chapterText: { fontSize: 16, fontWeight: '900', color: '#111' },
  chapterActiveText: { color: '#fff' },

  // IA modal
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
  aiHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#111', paddingHorizontal: 10 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, gap: 6 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  aiLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  aiBody: { padding: 16, paddingBottom: 30 },
  aiSubject: { textAlign: 'center', fontSize: 18, fontWeight: '900', marginBottom: 14, color: '#111' },
  aiHint: { marginTop: 10, fontSize: 12, color: '#8E8E93', textAlign: 'center' },

  // InfoCards
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

  // Tela de erro sem book
  centerSafe: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  centerTitle: { fontSize: 18, fontWeight: '900', marginBottom: 10, color: '#111' },
  centerText: { color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  centerBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  centerBtnText: { color: '#fff', fontWeight: '900' },
});
