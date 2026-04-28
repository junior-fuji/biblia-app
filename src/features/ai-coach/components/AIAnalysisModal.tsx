import { fetchAIAnalysis } from '@/lib/openai';
import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type AIAnalysisType = 'CHAPTER' | 'VERSE';

type AIAnalysisResult = {
  theme?: string;
  exegesis?: string;
  context?: string;
  history?: string;
  theology?: string;
  application?: string;
  raw?: string;
};

type AIAnalysisModalProps = {
  visible: boolean;
  onClose: () => void;
  text: string;
  context: string;
  analysisType?: AIAnalysisType;
};

function normalizeAnalysisResult(result: unknown): AIAnalysisResult {
  if (!result) {
    return {};
  }

  if (typeof result === 'string') {
    return {
      raw: result,
      exegesis: result,
    };
  }

  if (typeof result !== 'object') {
    return {};
  }

  const value = result as Record<string, unknown>;

  return {
    theme: typeof value.theme === 'string' ? value.theme : undefined,
    exegesis: typeof value.exegesis === 'string' ? value.exegesis : undefined,
    context: typeof value.context === 'string' ? value.context : undefined,
    history: typeof value.history === 'string' ? value.history : undefined,
    theology: typeof value.theology === 'string' ? value.theology : undefined,
    application:
      typeof value.application === 'string' ? value.application : undefined,
    raw: typeof value.raw === 'string' ? value.raw : undefined,
  };
}

function buildStudyEnvelope(params: {
  data: AIAnalysisResult;
  context: string;
  analysisType: AIAnalysisType;
}) {
  const { data, context, analysisType } = params;

  return {
    version: 1,
    kind: 'ai_bible_study',
    type: analysisType === 'VERSE' ? 'verse' : 'chapter',
    title: data.theme || `Análise: ${context || 'Texto bíblico'}`,
    reference: context || null,
    analysis: {
      theme: data.theme || '',
      history: data.history || data.context || '',
      exegesis: data.exegesis || data.raw || '',
      theology: data.theology || '',
      application: data.application || '',
    },
    raw: data.raw || null,
    meta: {
      generated_by: 'ai',
      created_at: new Date().toISOString(),
    },
  };
}

export function AIAnalysisModal({
  visible,
  onClose,
  text,
  context,
  analysisType = 'CHAPTER',
}: AIAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AIAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const safeText = useMemo(() => String(text || '').trim(), [text]);
  const safeContext = useMemo(() => String(context || '').trim(), [context]);

  const canAnalyze = useMemo(() => {
    return visible && safeText.length > 0;
  }, [safeText, visible]);

  const analyze = useCallback(async () => {
    if (!safeText) {
      setData(null);
      setErrorMessage('Nenhum texto foi enviado para análise.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchAIAnalysis(safeText, analysisType);
      setData(normalizeAnalysisResult(result));
    } catch (error) {
      console.log('AI_ANALYSIS_ERROR', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a análise.';

      setData(null);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [analysisType, safeText]);

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      setSaving(false);
      setData(null);
      setErrorMessage(null);
      return;
    }

    if (!canAnalyze) {
      setData(null);
      setErrorMessage('Nenhum texto foi enviado para análise.');
      return;
    }

    void analyze();
  }, [analyze, canAnalyze, visible]);

  const handleSave = useCallback(async () => {
    if (!data) {
      Alert.alert('Nada para salvar', 'Gere uma análise antes de salvar.');
      return;
    }

    const sb = getSupabaseOrNull();

    if (!sb) {
      Alert.alert('Erro', 'Supabase não está configurado.');
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await sb.auth.getUser();

      if (userError || !user) {
        Alert.alert('Login necessário', 'Faça login para salvar este estudo.');
        return;
      }

      const envelope = buildStudyEnvelope({
        data,
        context: safeContext,
        analysisType,
      });

      const { error } = await sb.from('saved_notes').insert({
        user_id: user.id,
        title: envelope.title,
        reference: safeContext || null,
        content: JSON.stringify(envelope),
      });

      if (error) {
        console.log('SAVE_AI_ANALYSIS_ERROR', error);
        Alert.alert('Erro ao salvar', error.message);
        return;
      }

      Alert.alert('Salvo', 'Estudo salvo com sucesso!');
    } catch (error) {
      console.log('SAVE_AI_ANALYSIS_FATAL', error);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o estudo.';

      Alert.alert('Erro ao salvar', message);
    } finally {
      setSaving(false);
    }
  }, [analysisType, data, safeContext]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dr. Logos (IA)</Text>

          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#ccc" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#AF52DE" />
            <Text>Consultando as escrituras...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{errorMessage}</Text>

            <TouchableOpacity style={styles.retryBtn} onPress={analyze}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Text style={styles.label}>TEMA</Text>
              <Text style={styles.body}>
                {data.theme || 'Tema não identificado.'}
              </Text>
            </View>

            <View style={[styles.card, { borderLeftColor: '#007AFF' }]}>
              <Text style={styles.label}>EXEGESE</Text>
              <Text style={styles.body}>
                {data.exegesis || data.raw || 'Sem exegese disponível.'}
              </Text>
            </View>

            <View style={[styles.card, { borderLeftColor: '#FF9500' }]}>
              <Text style={styles.label}>CONTEXTO</Text>
              <Text style={styles.body}>
                {data.context || data.history || 'Sem contexto disponível.'}
              </Text>
            </View>

            <View style={[styles.card, { borderLeftColor: '#AF52DE' }]}>
              <Text style={styles.label}>TEOLOGIA</Text>
              <Text style={styles.body}>
                {data.theology || 'Sem observações teológicas disponíveis.'}
              </Text>
            </View>

            <View style={[styles.card, { borderLeftColor: '#34C759' }]}>
              <Text style={styles.label}>APLICAÇÃO</Text>
              <Text style={styles.body}>
                {data.application || 'Sem aplicação disponível.'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="save" size={20} color="#fff" />
              )}

              <Text style={styles.saveText}>
                {saving ? 'Salvando...' : 'Salvar Estudo'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
          </ScrollView>
        ) : (
          <View style={styles.center}>
            <Text>Não foi possível analisar.</Text>

            <TouchableOpacity style={styles.retryBtn} onPress={analyze}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#AF52DE',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#333',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#999',
    marginBottom: 5,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#AF52DE',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  retryBtn: {
    backgroundColor: '#AF52DE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});