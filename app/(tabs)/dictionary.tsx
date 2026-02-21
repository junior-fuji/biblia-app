import { fetchAIAnalysis } from '@/lib/openai';
import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AnyObj = Record<string, any>;

function isNonEmptyString(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function asArray(v: any): any[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function safeString(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function renderBullets(items: any[], getLine: (it: any) => string) {
  const lines = items
    .map((it) => getLine(it))
    .map((s) => (isNonEmptyString(s) ? s.trim() : ''))
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      {lines.map((line, idx) => (
        <Text key={idx} style={styles.body}>
          {'• '}{line}
        </Text>
      ))}
    </View>
  );
}

function SectionCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: any;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.label, { color }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function DictionaryScreen() {
  const router = useRouter();

  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnyObj | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const termTitle = useMemo(() => {
    const t = (result?.term || result?.title || word || '').toString();
    return t.trim() ? t.trim() : 'Dicionário';
  }, [result, word]);

  const handleSearch = async () => {
    const q = word.trim();
    if (!q) return;

    setErrorMsg(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await fetchAIAnalysis(q, 'DICTIONARY');
      if (data) setResult(data as AnyObj);
      else setErrorMsg('A IA não retornou dados (JSON inválido ou resposta vazia).');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Não foi possível buscar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    const sb = getSupabaseOrNull();
    if (!sb) {
      Alert.alert('Supabase', 'Supabase não configurado neste build.');
      return;
    }

    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        Alert.alert('Login necessário', 'Faça login para salvar no Meus Estudos.');
        return;
      }

      const { error } = await sb.from('saved_notes').insert({
        user_id: user.id,                 // ✅ multiusuário
        title: `Dicionário: ${termTitle}`,
        reference: `Termo Bíblico — ${termTitle}`, // ✅ nunca null
        content: JSON.stringify(result),
      });

      if (error) throw error;

      Alert.alert('Salvo!', "Verbete salvo em 'Meus Estudos'.");
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível salvar.');
    }
  };

  const definition = useMemo(() => {
    return result?.definition || result?.theme || result?.meaning || result?.def || '';
  }, [result]);

  const originals = useMemo(() => {
    return asArray(result?.originals || result?.exegesis || result?.original || result?.terms);
  }, [result]);

  const keyTexts = useMemo(() => {
    return asArray(result?.key_texts || result?.keyTexts || result?.texts_key || result?.main_texts);
  }, [result]);

  const supportTexts = useMemo(() => {
    return asArray(result?.support_texts || result?.supportTexts || result?.texts_support || result?.support);
  }, [result]);

  const distinctions = useMemo(() => {
    return asArray(result?.theological_distinctions || result?.distinctions || result?.theology_distinctions);
  }, [result]);

  const rawFallback = useMemo(() => safeString(result), [result]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Dicionário Teológico</Text>

        <View style={{ width: 30, alignItems: 'flex-end' }}>
          {result && (
            <TouchableOpacity onPress={handleSave}>
              <Ionicons name="bookmark" size={24} color="#AF52DE" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Ex: Graça, Justificação, Logos..."
          value={word}
          onChangeText={setWord}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Erro</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {!result ? (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>Digite um termo bíblico para investigar.</Text>
          </View>
        ) : (
          <>
            <View style={styles.termHeader}>
              <Text style={styles.termTitle}>{termTitle}</Text>
            </View>

            <SectionCard title="DEFINIÇÃO TEOLÓGICA" icon="document-text-outline" color="#111">
              {isNonEmptyString(definition) ? (
                <Text style={styles.definitionText}>{definition}</Text>
              ) : (
                <Text style={styles.muted}>Sem definição retornada.</Text>
              )}
            </SectionCard>

            <SectionCard title="TERMOS ORIGINAIS" icon="language-outline" color="#007AFF">
              {renderBullets(originals, (it) => {
                if (typeof it === 'string') return it;
                const o = it as AnyObj;
                const lang = o.language ? String(o.language).toUpperCase() : '';
                const lemma = o.lemma || o.word || o.term || '';
                const tr = o.transliteration ? ` (${o.transliteration})` : '';
                const gloss = o.gloss || o.meaning || o.sense || '';
                const strong = o.strong ? ` [Strong ${o.strong}]` : '';
                const notes = o.notes || o.note || o.comment || '';
                const head = `${lang ? lang + ': ' : ''}${lemma}${tr}${strong}`.trim();
                const tail = [gloss, notes].filter(isNonEmptyString).join(' — ');
                return tail ? `${head} — ${tail}` : head;
              }) ?? <Text style={styles.muted}>Sem termos originais retornados.</Text>}
            </SectionCard>

            <SectionCard title="TEXTOS-CHAVE" icon="book-outline" color="#34C759">
              {renderBullets(keyTexts, (it) => {
                if (typeof it === 'string') return it;
                const o = it as AnyObj;
                const ref = o.reference || o.ref || o.verse || '';
                const expl = o.explanation || o.exegesis || o.note || o.text || '';
                const excerpt = o.excerpt ? `“${o.excerpt}” ` : '';
                if (isNonEmptyString(ref) && isNonEmptyString(expl)) return `${ref} — ${excerpt}${expl}`;
                if (isNonEmptyString(ref)) return ref;
                return safeString(o);
              }) ?? <Text style={styles.muted}>Sem textos-chave retornados.</Text>}
            </SectionCard>

            <SectionCard title="TEXTOS DE SUPORTE" icon="bookmark-outline" color="#FF9500">
              {renderBullets(supportTexts, (it) => {
                if (typeof it === 'string') return it;
                const o = it as AnyObj;
                const ref = o.reference || o.ref || o.verse || '';
                const expl = o.explanation || o.note || o.text || '';
                if (isNonEmptyString(ref) && isNonEmptyString(expl)) return `${ref} — ${expl}`;
                if (isNonEmptyString(ref)) return ref;
                return safeString(o);
              }) ?? <Text style={styles.muted}>Sem textos de suporte retornados.</Text>}
            </SectionCard>

            <SectionCard title="DISTINÇÕES TEOLÓGICAS" icon="git-compare-outline" color="#AF52DE">
              {renderBullets(distinctions, (it) => {
                if (typeof it === 'string') return it;
                const o = it as AnyObj;
                const title = o.title || o.name || '';
                const text = o.text || o.explanation || o.note || '';
                if (isNonEmptyString(title) && isNonEmptyString(text)) return `${title}: ${text}`;
                if (isNonEmptyString(text)) return text;
                return safeString(o);
              }) ?? <Text style={styles.muted}>Sem distinções retornadas.</Text>}
            </SectionCard>

            {!isNonEmptyString(definition) &&
              originals.length === 0 &&
              keyTexts.length === 0 &&
              supportTexts.length === 0 &&
              distinctions.length === 0 && (
                <SectionCard title="RESPOSTA BRUTA" icon="code-outline" color="#8E8E93">
                  <Text style={styles.rawText}>{rawFallback}</Text>
                </SectionCard>
              )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  searchBar: { flexDirection: 'row', padding: 15, gap: 10 },
  input: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 12, fontSize: 16 },
  searchBtn: { width: 52, backgroundColor: '#AF52DE', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  content: { padding: 15 },

  errorBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  errorTitle: { color: '#D70015', fontWeight: '800' },
  errorText: { color: '#D70015', marginTop: 6 },

  termHeader: { paddingHorizontal: 4, paddingBottom: 8 },
  termTitle: { fontSize: 22, fontWeight: '900', color: '#111' },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },

  definitionText: { fontSize: 16, fontWeight: '700', color: '#222', lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22, color: '#333' },
  muted: { color: '#999', fontSize: 14 },
  rawText: { fontSize: 12, color: '#333' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10 },
});