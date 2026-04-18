import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { useSettings } from '@/src/providers/SettingsProvider';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SearchResult = {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
};

type VersionRow = {
  id: string;
  code: string;
  name: string;
};

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

const supabase = getSupabaseOrThrow();

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function looksJapanese(term: string) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(term);
}

function isWholeWordMatch(text: string, term: string): boolean {
  const q = term.trim();
  if (!q) return false;

  if (looksJapanese(q)) {
    return String(text || '').includes(q);
  }

  const t = normalizeText(text);
  const nq = normalizeText(q);
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(nq)}([^a-z0-9]|$)`, 'i');
  return re.test(t);
}

function getBookShort(bookId: number) {
  return BOOK_MAP[bookId]?.abbrev || String(bookId);
}

async function fetchVersions(): Promise<VersionRow[]> {
  const { data, error } = await supabase
    .from('bible_versions')
    .select('id, code, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as VersionRow[];
}

async function resolveVersionId(code: string): Promise<string> {
  const { data, error } = await supabase
    .from('bible_versions')
    .select('id, code, name')
    .eq('code', code)
    .single();

  if (error || !data) {
    throw new Error(`Versão não encontrada: ${code}`);
  }

  return (data as VersionRow).id;
}

export default function SearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { settings } = useSettings();

  const initialQ = useMemo(() => (typeof q === 'string' ? q : ''), [q]);
  const initialVersion = useMemo(
    () => String(settings?.bibleVersion || 'ARA').toUpperCase(),
    [settings?.bibleVersion]
  );

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [versionCode, setVersionCode] = useState(initialVersion);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await fetchVersions();
        if (!alive) return;
        setVersions(data);

        if (data.length > 0 && !data.some((v) => v.code === versionCode)) {
          setVersionCode(data[0].code);
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setVersions([
          { id: 'fallback-ara', code: 'ARA', name: 'ARA' },
          { id: 'fallback-arc', code: 'ARC', name: 'ARC' },
          { id: 'fallback-acf', code: 'ACF', name: 'ACF' },
          { id: 'fallback-nvi', code: 'NVI', name: 'NVI' },
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

  const doSearch = useCallback(
    async (text: string, currentVersionCode?: string) => {
      const term = text.trim();
      if (term.length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        const versionId = await resolveVersionId(currentVersionCode || versionCode);

        const { data, error } = await supabase
          .from('bible_verses')
          .select('id, book, chapter, verse, text')
          .eq('version_id', versionId)
          .ilike('text', `%${term}%`)
          .order('book', { ascending: true })
          .order('chapter', { ascending: true })
          .order('verse', { ascending: true })
          .limit(300);

        if (error) {
          console.error(error);
          setResults([]);
          return;
        }

        const rows = ((data as any[]) ?? []).map((r) => ({
          id: Number(r.id),
          book_id: Number(r.book),
          chapter: Number(r.chapter),
          verse: Number(r.verse),
          text: String(r.text || ''),
        }));

        const filtered = rows.filter((r) => isWholeWordMatch(r.text, term));
        setResults(filtered.slice(0, 120));
      } catch (e) {
        console.error(e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [versionCode]
  );

  useEffect(() => {
    if (initialQ.trim().length >= 1) {
      setQuery(initialQ);
      doSearch(initialQ, versionCode);
    }
  }, [initialQ, versionCode, doSearch]);

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      router.push({
        pathname: '/read/[book]',
        params: {
          book: String(item.book_id),
          chapter: String(item.chapter),
          verse: String(item.verse),
          returnTo: '/search?q=' + encodeURIComponent(query),
        },
      } as any);
    },
    [router, query]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Buscar palavra na Bíblia…"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch(query)}
            returnKeyType="search"
            autoFocus={!initialQ}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.versionRow}>
        <TouchableOpacity onPress={() => setShowVersions(true)} style={styles.versionChip}>
          <Text style={styles.versionChipText}>{versionCode}</Text>
          <Ionicons name="chevron-down" size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Pesquisando nas Escrituras…</Text>
        </View>
      ) : results.length === 0 ? (
        <Text style={styles.emptyText}>
          {query.trim().length < 1 ? 'Digite algo para pesquisar.' : 'Nenhum resultado encontrado.'}
        </Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
          renderItem={({ item }) => {
            const bookShort = getBookShort(item.book_id);
            return (
              <TouchableOpacity onPress={() => handleResultPress(item)} style={styles.resultItem}>
                <Text style={styles.resultRef}>
                  {bookShort} {item.chapter}:{item.verse}
                </Text>
                <Text style={styles.resultText}>{item.text}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={showVersions} animationType="slide" onRequestClose={() => setShowVersions(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escolha a versão</Text>
            <TouchableOpacity onPress={() => setShowVersions(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={versions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
            renderItem={({ item }) => {
              const active = item.code === versionCode;
              return (
                <TouchableOpacity
                  onPress={() => {
                    setVersionCode(item.code);
                    setShowVersions(false);
                    if (query.trim()) {
                      doSearch(query, item.code);
                    } else {
                      setResults([]);
                    }
                  }}
                  style={[styles.versionItem, active && styles.versionItemActive]}
                >
                  <Text style={[styles.versionItemCode, active && styles.versionItemCodeActive]}>
                    {item.code}
                  </Text>
                  <Text style={[styles.versionItemName, active && styles.versionItemNameActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },

  backBtn: { padding: 4 },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 10,
    borderRadius: 10,
    height: 40,
    gap: 8,
  },

  input: { flex: 1, fontSize: 16 },

  versionRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },

  versionChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  versionChipText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
    marginRight: 6,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },

  resultItem: {
    paddingBottom: 12,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  resultRef: {
    fontSize: 14,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 4,
  },

  resultText: { fontSize: 16, color: '#333', lineHeight: 22 },

  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
    paddingHorizontal: 20,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111',
  },

  modalClose: {
    fontSize: 16,
    fontWeight: '800',
    color: '#007AFF',
  },

  versionItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },

  versionItemActive: {
    backgroundColor: '#007AFF',
  },

  versionItemCode: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
  },

  versionItemCodeActive: {
    color: '#fff',
  },

  versionItemName: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  versionItemNameActive: {
    color: '#EAF2FF',
  },
});