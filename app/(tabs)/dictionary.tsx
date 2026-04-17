import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useSettings } from '@/src/providers/SettingsProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL_RAW =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'https://biblia-app-six.vercel.app';

function normalizeBaseUrl(base: string) {
  if (!base) return '';
  if (!/^https?:\/\//i.test(base)) return `https://${base}`;
  return base;
}

const API_BASE_URL = normalizeBaseUrl(API_BASE_URL_RAW);

type DictionaryResult = {
  theme?: string;
  history?: string;
  culture?: string;
  exegesis?: string;
  theology?: string;
  application?: string;
};

function extractJsonObject(text: string): string | null {
  if (!text) return null;
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function getDictionaryLanguage(versionCode: string) {
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

function buildDictionaryPrompts(language: 'pt' | 'es' | 'ja' | 'en', termTitle: string) {
  const systemPrompt =
    language === 'es'
      ? `
Eres un especialista en términos bíblicos y teológicos.
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
Escribe con profundidad real, claridad pastoral y precisión teológica.
`.trim()
      : language === 'ja'
      ? `
あなたは聖書用語と神学用語の専門家です。
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
日本語以外を混ぜないでください。
深い学術性とわかりやすさを両立してください。
`.trim()
      : language === 'en'
      ? `
You are a specialist in biblical and theological terms.
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
Write with real depth, theological precision, and pastoral clarity.
`.trim()
      : `
Você é um especialista em termos bíblicos e teológicos.
Responda EXCLUSIVAMENTE com JSON válido e TODO o conteúdo deve estar em português.
Sem markdown e sem texto fora do JSON.
A estrutura JSON deve conter exatamente:
{
  "theme": "",
  "history": "",
  "culture": "",
  "exegesis": "",
  "theology": "",
  "application": ""
}
Escreva com profundidade real, precisão teológica e clareza pastoral.
`.trim();

  const userPrompt =
    language === 'es'
      ? `Explique profundamente el término bíblico "${termTitle}". Incluya significado, contexto histórico, contexto cultural, matices del original, teología y aplicación práctica.`
      : language === 'ja'
      ? `聖書用語「${termTitle}」を詳しく説明してください。意味、歴史的背景、文化的背景、原語のニュアンス、神学的意味、実践的適用を含めてください。回答は自然な日本語のみで書いてください。`
      : language === 'en'
      ? `Explain the biblical term "${termTitle}" in depth. Include meaning, historical background, cultural background, original-language nuances, theology, and practical application.`
      : `Explique profundamente o termo bíblico "${termTitle}". Inclua significado, contexto histórico, contexto cultural, nuances do original, teologia e aplicação prática.`;

  return { systemPrompt, userPrompt };
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

export default function DictionaryScreen() {
  const { settings } = useSettings();
  const versionCode = useMemo(() => String(settings?.bibleVersion || 'ARA'), [settings?.bibleVersion]);

  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [rawText, setRawText] = useState('');
  const [searchedTerm, setSearchedTerm] = useState('');

  async function handleSearch() {
    const termTitle = term.trim();
    if (!termTitle) {
      Alert.alert('Dicionário', 'Digite um termo para pesquisar.');
      return;
    }

    setLoading(true);
    setResult(null);
    setRawText('');
    setSearchedTerm(termTitle);

    try {
      const language = getDictionaryLanguage(versionCode) as 'pt' | 'es' | 'ja' | 'en';
      const { systemPrompt, userPrompt } = buildDictionaryPrompts(language, termTitle);

      const url = Platform.OS === 'web' ? '/api/chat' : `${API_BASE_URL}/api/chat`;

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

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

      const content: string = body?.choices?.[0]?.message?.content ?? body?.output_text ?? '';
      const maybeJson = extractJsonObject(String(content));

      if (maybeJson) {
        try {
          const parsed = JSON.parse(maybeJson);
          setResult({
            theme: parsed.theme || '',
            history: parsed.history || '',
            culture: parsed.culture || '',
            exegesis: parsed.exegisis ?? parsed.exegesis ?? '',
            theology: parsed.theology || '',
            application: parsed.application || '',
          });
        } catch {
          setRawText(String(content));
        }
      } else {
        setRawText(String(content));
      }
    } catch (e: any) {
      setRawText(`Erro: ${e?.message || 'não foi possível consultar a IA'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!searchedTerm || (!result && !rawText)) return;

    setSaving(true);
    try {
      const sb = getSupabaseOrNull();
      if (!sb) {
        Alert.alert('Supabase', 'Supabase não configurado neste build.');
        return;
      }

      const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
      if (sessionErr) throw sessionErr;

      const user = sessionData.session?.user;
      if (!user) {
        Alert.alert('Login necessário', 'Faça login para salvar no Estudos.');
        return;
      }

      const payloadContent = JSON.stringify({
        version: 1,
        type: 'dictionary',
        source: 'dictionary',
        title: `Dicionário: ${searchedTerm}`,
        term: searchedTerm,
        analysis: result,
        raw: rawText || null,
        created_at: new Date().toISOString(),
      });

      const { error } = await sb.from('saved_notes').insert({
        user_id: user.id,
        title: `Dicionário: ${searchedTerm}`,
        reference: `Termo Bíblico — ${searchedTerm}`,
        content: payloadContent,
      });

      if (error) throw error;

      Alert.alert('Salvo', 'Entrada do dicionário salva em Estudos.');
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e?.message || 'Falha inesperada.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Ionicons name="library" size={20} color="#fff" />
            <Text style={styles.headerBadgeText}>Dicionário Bíblico</Text>
          </View>

          <Text style={styles.headerTitle}>Termos e conceitos</Text>
          <Text style={styles.headerSubtitle}>Versão de referência: {versionCode}</Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Digite um termo bíblico"
            placeholderTextColor="#8E8E93"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />

          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.searchBtnText}>Pesquisar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!loading && !result && !rawText ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={36} color="#B0B0B0" />
              <Text style={styles.emptyTitle}>Pesquise um termo</Text>
              <Text style={styles.emptyText}>
                Ex.: graça, justificação, aliança, templo, reino, santificação.
              </Text>
            </View>
          ) : null}

          {searchedTerm ? (
            <View style={styles.termHeader}>
              <Text style={styles.termLabel}>TERMO</Text>
              <Text style={styles.termTitle}>{searchedTerm}</Text>

              {(result || rawText) && (
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.saveBtnText}>Salvar</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {result ? (
            <>
              <InfoCard title="SIGNIFICADO CENTRAL" icon="bookmark" color="#1C1C1E" text={result.theme} />
              <InfoCard title="CONTEXTO HISTÓRICO" icon="time" color="#FF9500" text={result.history} />
              <InfoCard title="CONTEXTO CULTURAL" icon="people" color="#8E44AD" text={result.culture} />
              <InfoCard title="EXEGESE & ORIGINAL" icon="search" color="#007AFF" text={result.exegesis} />
              <InfoCard title="TEOLOGIA" icon="book" color="#AF52DE" text={result.theology} />
              <InfoCard title="APLICAÇÃO PRÁTICA" icon="leaf" color="#34C759" text={result.application} />
            </>
          ) : null}

          {!result && !!rawText ? (
            <View style={styles.rawBox}>
              <Text style={styles.rawText}>{rawText}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },

  headerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },

  headerBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 6,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111',
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  searchBox: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111',
    marginBottom: 10,
  },

  searchBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  searchBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    marginLeft: 6,
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },

  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },

  termHeader: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  termLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  termTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },

  saveBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  saveBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    marginLeft: 6,
  },

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

  infoContent: {
    flex: 1,
    padding: 14,
    paddingVertical: 16,
  },

  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  infoText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    textAlign: 'justify',
  },

  rawBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },

  rawText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },
});