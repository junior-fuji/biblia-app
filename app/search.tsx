import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
  text_pt: string;
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

function isWholeWordMatch(text: string, term: string): boolean {
  const t = normalizeText(text);
  const q = normalizeText(term.trim());
  if (!q) return false;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(q)}([^a-z0-9]|$)`, 'i');
  return re.test(t);
}

function getBookShort(bookId: number) {
  return BOOK_MAP[bookId]?.abbrev || String(bookId);
}

export default function SearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const initialQ = useMemo(() => (typeof q === 'string' ? q : ''), [q]);

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (text: string) => {
    const term = text.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verses')
        .select('id, book_id, chapter, verse, text_pt')
        .textSearch('text_pt_tsv', term, {
          type: 'websearch',
          config: 'portuguese',
        })
        .order('book_id', { ascending: true })
        .order('chapter', { ascending: true })
        .order('verse', { ascending: true })
        .limit(300);

      if (error) {
        console.error(error);
        setResults([]);
        return;
      }

      const rows = ((data as SearchResult[]) ?? []).filter((r) =>
        isWholeWordMatch(r.text_pt, term)
      );

      setResults(rows.slice(0, 120));
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca automática quando vem via /search?q=
  useEffect(() => {
    if (initialQ.trim().length >= 2) {
      setQuery(initialQ);
      doSearch(initialQ);
    }
  }, [initialQ, doSearch]);

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      router.push({
        pathname: '/read/[book]',
        params: {
          book: String(item.book_id),
          chapter: String(item.chapter),
          verse: String(item.verse),
          // volta pra busca mantendo o termo
          returnTo: '/search?q=' + encodeURIComponent(query),
        },
      });
    },
    [router, query]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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

      {/* Corpo */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Pesquisando nas Escrituras…</Text>
        </View>
      ) : results.length === 0 ? (
        <Text style={styles.emptyText}>
          {query.trim().length < 2 ? 'Digite pelo menos 2 letras.' : 'Nenhum resultado exato encontrado.'}
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
                <Text style={styles.resultText}>{item.text_pt}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
});
