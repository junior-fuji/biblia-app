import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SketchSections = {
  theme: string;
  exegesis: string;
  context: string;
  theology: string;
  application: string;
};

type SavedSketchEnvelope = {
  version?: number;
  type?: string;
  source?: string;
  format?: string;
  title?: string;
  sections?: Partial<SketchSections>;
  created_at?: string;
};

type SavedNoteRow = {
  id: number | string;
  title: string;
  reference?: string | null;
  content: string | SavedSketchEnvelope;
  created_at: string;
  user_id: string;
};

type CardSectionProps = {
  title: string;
  textValue?: string;
  onChangeText: (text: string) => void;
  isEditing: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  fontSize: number;
};

function CardSection({
  title,
  textValue = '',
  onChangeText,
  isEditing,
  icon,
  color,
  bgColor,
  fontSize,
}: CardSectionProps) {
  if (!isEditing && !textValue) return null;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.cardHeader, { backgroundColor: bgColor }]}>
        <Ionicons
          name={icon}
          size={20}
          color={color}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      </View>

      <View style={styles.cardBody}>
        {isEditing ? (
          <TextInput
            style={[styles.input, { fontSize, lineHeight: fontSize * 1.5 }]}
            multiline
            value={textValue || ''}
            onChangeText={onChangeText}
            placeholder={`Digite aqui o conteúdo de ${title}...`}
            textAlignVertical="top"
          />
        ) : (
          <Text
            style={[
              styles.cardText,
              { fontSize, lineHeight: fontSize * 1.5 },
            ]}
          >
            {textValue}
          </Text>
        )}
      </View>
    </View>
  );
}

function normalizeSketchContent(
  raw: SavedNoteRow['content'],
  fallbackTitle: string,
): SavedSketchEnvelope {
  let parsed: SavedSketchEnvelope | string = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as SavedSketchEnvelope;
    } catch {
      parsed = {
        version: 1,
        type: 'sketch',
        source: 'manual',
        format: 'editable_study',
        title: fallbackTitle,
        sections: {
          theme: '',
          exegesis: raw,
          context: '',
          theology: '',
          application: '',
        },
      };
    }
  }

  const normalized =
    typeof parsed === 'object' && parsed !== null
      ? parsed
      : {
          version: 1,
          type: 'sketch',
          source: 'manual',
          format: 'editable_study',
          title: fallbackTitle,
          sections: {
            theme: '',
            exegesis: '',
            context: '',
            theology: '',
            application: '',
          },
        };

  const sections = normalized.sections ?? {};

  return {
    version: normalized.version ?? 1,
    type: normalized.type ?? 'sketch',
    source: normalized.source ?? 'manual',
    format: normalized.format ?? 'editable_study',
    title: normalized.title ?? fallbackTitle,
    created_at: normalized.created_at,
    sections: {
      theme: sections.theme ?? '',
      exegesis: sections.exegesis ?? '',
      context: sections.context ?? '',
      theology: sections.theology ?? '',
      application: sections.application ?? '',
    },
  };
}

export default function SketchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<SavedNoteRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<SavedSketchEnvelope | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [saving, setSaving] = useState(false);

  const loadSketch = useCallback(async () => {
    setLoading(true);

    try {
      const sb = getSupabaseOrThrow();

      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user?.id) {
        Alert.alert('Login necessário', 'Faça login para acessar este estudo.');
        router.back();
        return;
      }

      const { data, error } = await sb
        .from('saved_notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      const row = data as SavedNoteRow;
      setNote(row);
      setContent(normalizeSketchContent(row.content, row.title));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o estudo.';

      Alert.alert('Erro', message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void loadSketch();
  }, [loadSketch]);

  function updateSection(field: keyof SketchSections, value: string) {
    setContent((prev) =>
      prev
        ? {
            ...prev,
            sections: {
              theme: prev.sections?.theme ?? '',
              exegesis: prev.sections?.exegesis ?? '',
              context: prev.sections?.context ?? '',
              theology: prev.sections?.theology ?? '',
              application: prev.sections?.application ?? '',
              [field]: value,
            },
          }
        : prev,
    );
  }

  async function handleShare() {
    if (!content || !note) return;

    const sections = content.sections ?? {
      theme: '',
      exegesis: '',
      context: '',
      theology: '',
      application: '',
    };

    try {
      const message = `
📖 *ESTUDO BÍBLICO: ${content.title || note.title}*
📅 ${new Date(note.created_at).toLocaleDateString('pt-BR')}

📌 *TEMA CENTRAL*
${sections.theme}

🔍 *EXEGESE & ORIGINAL*
${sections.exegesis}

🏛️ *CONTEXTO HISTÓRICO*
${sections.context}

🔗 *TEOLOGIA BÍBLICA*
${sections.theology}

💡 *APLICAÇÃO PRÁTICA*
${sections.application}

_Gerado pelo meu App Bíblia IA_
      `.trim();

      await Share.share({ message });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível compartilhar.';

      Alert.alert('Erro', message);
    }
  }

  async function handleSave() {
    if (!content || !note) return;

    setSaving(true);

    try {
      const sb = getSupabaseOrThrow();

      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado.');
      }

      const payload: SavedSketchEnvelope = {
        version: 1,
        type: 'sketch',
        source: 'manual',
        format: 'editable_study',
        title: content.title || note.title,
        created_at:
          content.created_at || note.created_at || new Date().toISOString(),
        sections: {
          theme: content.sections?.theme ?? '',
          exegesis: content.sections?.exegesis ?? '',
          context: content.sections?.context ?? '',
          theology: content.sections?.theology ?? '',
          application: content.sections?.application ?? '',
        },
      };

      const { data, error } = await sb
        .from('saved_notes')
        .update({
          title: payload.title || note.title,
          reference: 'Estudo / Esboço',
          content: JSON.stringify(payload),
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      const updated = data as SavedNoteRow;
      setNote(updated);
      setContent(normalizeSketchContent(updated.content, updated.title));
      setIsEditing(false);

      Alert.alert('Sucesso', 'Estudo atualizado!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao salvar.';

      Alert.alert('Erro ao atualizar', message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#AF52DE"
        style={{ marginTop: 50 }}
      />
    );
  }

  if (!note || !content) {
    return null;
  }

  const sections = content.sections ?? {
    theme: '',
    exegesis: '',
    context: '',
    theology: '',
    application: '',
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {content.title || note.title}
            </Text>
            <Text style={styles.date}>
              {new Date(note.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {!isEditing ? (
              <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
                <Ionicons name="share-outline" size={22} color="#007AFF" />
              </TouchableOpacity>
            ) : null}

            {isEditing ? (
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.actionBtn}
              >
                <Ionicons name="pencil" size={22} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!isEditing ? (
          <View style={styles.fontControlsContainer}>
            <View style={styles.fontControls}>
              <TouchableOpacity
                onPress={() => setFontSize((current) => Math.max(12, current - 2))}
                style={styles.fontBtn}
              >
                <Text style={styles.fontBtnText}>A-</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFontSize((current) => Math.min(26, current + 2))}
                style={styles.fontBtn}
              >
                <Text style={styles.fontBtnText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.themeBox}>
            <Text style={styles.themeLabel}>TEMA CENTRAL</Text>
            {isEditing ? (
              <TextInput
                style={[styles.themeInput, { fontSize: 18 }]}
                multiline
                value={sections.theme}
                onChangeText={(text) => updateSection('theme', text)}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.themeText}>{sections.theme}</Text>
            )}
          </View>

          <CardSection
            title="Exegese & Original"
            textValue={sections.exegesis}
            onChangeText={(text) => updateSection('exegesis', text)}
            isEditing={isEditing}
            fontSize={fontSize}
            icon="search"
            color="#007AFF"
            bgColor="#E3F2FD"
          />

          <CardSection
            title="Contexto Histórico"
            textValue={sections.context}
            onChangeText={(text) => updateSection('context', text)}
            isEditing={isEditing}
            fontSize={fontSize}
            icon="time"
            color="#FF9500"
            bgColor="#FFF3E0"
          />

          <CardSection
            title="Conexões Teológicas"
            textValue={sections.theology}
            onChangeText={(text) => updateSection('theology', text)}
            isEditing={isEditing}
            fontSize={fontSize}
            icon="git-merge"
            color="#AF52DE"
            bgColor="#F3E5F5"
          />

          <CardSection
            title="Aplicação Prática"
            textValue={sections.application}
            onChangeText={(text) => updateSection('application', text)}
            isEditing={isEditing}
            fontSize={fontSize}
            icon="heart"
            color="#34C759"
            bgColor="#E8F5E9"
          />

          {isEditing ? <View style={{ height: 300 }} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },

  iconButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },

  date: {
    fontSize: 12,
    color: '#8E8E93',
  },

  actionBtn: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fontControlsContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  fontControls: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
  },

  fontBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  fontBtnText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  themeBox: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },

  themeLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },

  themeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 26,
  },

  themeInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingBottom: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cardBody: {
    padding: 16,
  },

  cardText: {
    color: '#333',
    textAlign: 'justify',
  },

  input: {
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});