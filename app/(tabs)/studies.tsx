import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal, Platform, ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Study = {
  id: string | number;
  title: string;
  content: string | null;
  reference: string | null;
  observation?: string | null;
  application?: string | null;
  prayer?: string | null;
  created_at: string;
  user_id?: string | null;
  client_id?: string | null;
  source?: 'supabase' | 'local';
};

type OldJson = {
  theme?: string;
  history?: string;
  exegesis?: string;
  theology?: string;
  application?: string;
};

type StudySourceTag =
  | 'ai_chapter'
  | 'ai_verse'
  | 'dictionary'
  | 'diary'
  | 'manual'
  | 'unknown';

type Envelope = {
  version?: number;
  kind?: 'ai_bible_study';
  type?: 'chapter' | 'verse' | 'sketch' | 'dictionary' | 'personal_study';
  source?: 'dictionary' | 'diary' | 'manual';
  format?: 'editable_study';
  ref?: {
    book_id?: number;
    chapter?: number;
    verse?: number | null;
    label?: string;
  };
  title?: string;
  reference?: string | null;
  analysis?: {
    theme?: string;
    history?: string;
    exegesis?: string;
    theology?: string;
    application?: string;
  } | null;
  sections?: {
    theme?: string;
    exegesis?: string;
    context?: string;
    theology?: string;
    application?: string;
  } | null;
  raw?: string | null;
  meta?: {
    generated_by?: 'ai';
    created_at?: string;
  };
};

type ParsedKind = 'envelope' | 'oldjson' | 'plain';
function getStudyTag(study: Study): {
  key: StudySourceTag;
  label: string;
  fg: string;
  bg: string;
} {
  const raw = String(study.content || '').trim();
  const obj = raw.startsWith('{') ? safeParseJson(raw) : null;

  if (obj && typeof obj === 'object') {
    if (obj.kind === 'ai_bible_study') {
      if (obj.type === 'chapter') {
        return { key: 'ai_chapter', label: 'IA • Capítulo', fg: '#AF52DE', bg: '#F3E5F5' };
      }
      if (obj.type === 'verse') {
        return { key: 'ai_verse', label: 'IA • Versículo', fg: '#007AFF', bg: '#E3F2FD' };
      }
    }

    if (obj.source === 'dictionary' || obj.type === 'dictionary') {
      return { key: 'dictionary', label: 'Dicionário', fg: '#FF9500', bg: '#FFF3E0' };
    }

    if (obj.source === 'diary' || obj.type === 'personal_study') {
      return { key: 'diary', label: 'Diário', fg: '#34C759', bg: '#E8F5E9' };
    }

    if (obj.source === 'manual' || obj.type === 'sketch' || obj.format === 'editable_study') {
      return { key: 'manual', label: 'Esboço', fg: '#FF6B00', bg: '#FFF1E6' };
    }
  }

  return { key: 'unknown', label: 'Estudo', fg: '#5E5CE6', bg: '#EEF0FF' };
}

function buildManualSketchEnvelope(title?: string) {
  return JSON.stringify({
    version: 1,
    type: 'sketch',
    source: 'manual',
    format: 'editable_study',
    title: title || 'Novo Estudo',
    sections: {
      theme: '',
      exegesis: '',
      context: '',
      theology: '',
      application: '',
    },
    created_at: new Date().toISOString(),
  });
}
const LOCAL_KEY = 'LOCAL_SAVED_NOTES_V1';

function toStudyId(studyId: string | number) {
  return String(studyId);
}

function generateLocalStudyId(existing: Study[]) {
  const maxId = existing.reduce((acc, s) => Math.max(acc, Number(s.id) || 0), 0);
  return String(maxId + 1);
}

async function getLocalStudies(): Promise<Study[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      ...item,
      source: 'local' as const,
    })) as Study[];
  } catch (error) {
    console.log('GET_LOCAL_STUDIES_ERROR', error);
    return [];
  }
}

async function saveLocalStudies(data: Study[]) {
  const sanitized = data.map(({ source, ...rest }) => rest);
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(sanitized));
}

function safeParseJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function isEnvelope(obj: any): obj is Envelope {
  return (
    obj &&
    typeof obj === 'object' &&
    (
      obj.kind === 'ai_bible_study' ||
      (
        ('ref' in obj || 'analysis' in obj) &&
        ('version' in obj || 'type' in obj)
      )
    )
  );
}

function isOldJson(obj: any): obj is OldJson {
  return (
    obj &&
    typeof obj === 'object' &&
    ('theme' in obj || 'exegesis' in obj || 'application' in obj)
  );
}

function buildEnvelopeFromEditor(params: {
  selectedStudy: Study;
  parsedEnvelope: Envelope | null;
  editTheme: string;
  editHistory: string;
  editExegesis: string;
  editTheology: string;
  editApplication: string;
}): string {
  const {
    selectedStudy,
    parsedEnvelope,
    editTheme,
    editHistory,
    editExegesis,
    editTheology,
    editApplication,
  } = params;

  const next: Envelope = {
    version: 1,
    kind: 'ai_bible_study',
    ...(parsedEnvelope || {}),
    title: editTheme || selectedStudy.title || 'Sem Título',
    reference: selectedStudy.reference ?? parsedEnvelope?.reference ?? null,
    analysis: {
      ...(parsedEnvelope?.analysis || {}),
      theme: editTheme || undefined,
      history: editHistory || undefined,
      exegesis: editExegesis || undefined,
      theology: editTheology || undefined,
      application: editApplication || undefined,
    },
    raw: parsedEnvelope?.raw ?? null,
    meta: {
      ...(parsedEnvelope?.meta || {}),
      generated_by: parsedEnvelope?.meta?.generated_by ?? 'ai',
      created_at: parsedEnvelope?.meta?.created_at ?? new Date().toISOString(),
    },
  };

  return JSON.stringify(next);
}

export default function StudiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { initialized, session } = useAuth();
  const user = session?.user?.id ?? null;

  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [editTheme, setEditTheme] = useState('');
  const [editHistory, setEditHistory] = useState('');
  const [editExegesis, setEditExegesis] = useState('');
  const [editTheology, setEditTheology] = useState('');
  const [editApplication, setEditApplication] = useState('');

  const [parsedKind, setParsedKind] = useState<ParsedKind>('plain');
  const [parsedEnvelope, setParsedEnvelope] = useState<Envelope | null>(null);
  const [parsedOld, setParsedOld] = useState<OldJson | null>(null);

  const [openRef, setOpenRef] = useState<{
    book_id: number;
    chapter: number;
    verse?: number | null;
    label?: string;
  } | null>(null);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates?.height ?? 0)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const fetchStudies = useCallback(async () => {
    if (!initialized) return;

    setLoading(true);

    try {
      const sb = getSupabaseOrNull();

      if (sb && userId) {
        const { data, error } = await sb
          .from('saved_notes')
          .select('id, created_at, title, reference, content, user_id, client_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('FETCH_STUDIES_SUPABASE_ERROR', error);
          setStudies([]);
          return;
        }

        const mapped: Study[] = (data ?? []).map((item: any) => ({
          id: item.id,
          title: item.title || 'Sem Título',
          content: item.content ?? null,
          reference: item.reference ?? null,
          observation: null,
          application: null,
          prayer: null,
          created_at: item.created_at,
          user_id: item.user_id ?? null,
          client_id: item.client_id ?? null,
          source: 'supabase',
        }));

        setStudies(mapped);
        return;
      }

      const local = await getLocalStudies();
      const sorted = [...local].sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return tb - ta;
      });

      setStudies(sorted);
    } catch (e) {
      console.log('FETCH_STUDIES_FATAL', e);
      setStudies([]);
    } finally {
      setLoading(false);
    }
  }, [initialized, userId]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  useFocusEffect(
    useCallback(() => {
      fetchStudies();
    }, [fetchStudies])
  );

  const resetModalState = () => {
    setOpenRef(null);
    setParsedEnvelope(null);
    setParsedOld(null);
    setParsedKind('plain');
    setEditTheme('');
    setEditHistory('');
    setEditExegesis('');
    setEditTheology('');
    setEditApplication('');
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudy(null);
    setIsEditing(false);
    resetModalState();
  };

  const openStudy = (study: Study) => {
  const tag = getStudyTag(study);

  if (tag.key === 'manual') {
    router.push(`/sketch/${study.id}` as any);
    return;
  }

  setSelectedStudy(study);
  setModalVisible(true);
  setIsEditing(false);

  setOpenRef(null);
  setParsedEnvelope(null);
  setParsedOld(null);
  setParsedKind('plain');

  let theme = study.title || 'Sem Título';
  let history = '';
  let exegesis = '';
  let theology = '';
  let application = '';

  const content = String(study.content || '').trim();

  if (content.startsWith('{')) {
    const obj = safeParseJson(content);

    if (isEnvelope(obj)) {
      setParsedKind('envelope');
      setParsedEnvelope(obj);

      const a = obj.analysis || {};
      theme = a.theme || obj.title || study.title || theme;
      history = a.history || '';
      exegesis = a.exegesis || '';
      theology = a.theology || '';
      application = a.application || '';

      const r = obj.ref;
      if (r && typeof r.book_id === 'number' && typeof r.chapter === 'number') {
        setOpenRef({
          book_id: r.book_id,
          chapter: r.chapter,
          verse: typeof r.verse === 'number' ? r.verse : null,
          label: r.label || study.reference || undefined,
        });
      }
    } else if (isOldJson(obj)) {
      setParsedKind('oldjson');
      setParsedOld(obj);

      theme = obj.theme || study.title || theme;
      history = obj.history || '';
      exegesis = obj.exegesis || '';
      theology = obj.theology || '';
      application = obj.application || '';
    
  } else {
    setParsedKind('plain');
    exegesis = study.content || '';
  }
  exegesis ? `${exegesis}\n\n[Obs]: ${study.observation}` : study.observation;
  }

  if (study.application) {
    application = application ? `${application}\n\n${study.application}` : study.application;
  }

  if (study.prayer) {
    application = application ? `${application}\n\n🙏 Oração: ${study.prayer}` : `🙏 Oração: ${study.prayer}`;
  }

  setEditTheme(String(theme || ''));
  setEditHistory(String(history || ''));
  setEditExegesis(String(exegesis || ''));
  setEditTheology(String(theology || ''));
  setEditApplication(String(application || ''));
};

  const canOpenBible = useMemo(() => !!openRef?.book_id && !!openRef?.chapter, [openRef]);

  const handleOpenBible = () => {
    if (!openRef) return;

    router.push({
      pathname: '/(tabs)/read/[book]',
      params: {
        book: String(openRef.book_id),
        chapter: String(openRef.chapter),
        verse: openRef.verse ? String(openRef.verse) : undefined,
      },
    });

    setModalVisible(false);
  };

  const handleShare = async () => {
    const refLine = selectedStudy?.reference ? `📌 ${selectedStudy.reference}\n\n` : '';
    const message =
      `*ESTUDO: ${editTheme}*\n\n` +
      refLine +
      (editHistory ? `🕰️ Contexto:\n${editHistory}\n\n` : '') +
      (editExegesis ? `🔎 Exegese:\n${editExegesis}\n\n` : '') +
      (editTheology ? `📚 Teologia:\n${editTheology}\n\n` : '') +
      (editApplication ? `🌱 Aplicação:\n${editApplication}\n\n` : '');

    try {
      await Share.share({ message });
    } catch (e) {
      console.log('SHARE_STUDY_ERROR', e);
    }
  };
  async function performDeleteStudy() {
    if (!selectedStudy) return;
  
    try {
      if (selectedStudy.source === 'supabase') {
        const sb = getSupabaseOrNull();
        if (!sb) {
          Alert.alert('Erro', 'Supabase não configurado.');
          return;
        }
  
        if (!userId) {
          Alert.alert('Login necessário', 'Faça login novamente para excluir.');
          return;
        }
  
        const rawStudyId = selectedStudy.id;
        const studyId =
          typeof rawStudyId === 'number'
            ? rawStudyId
            : Number(String(rawStudyId).trim());
  
        console.log('DELETE_DEBUG', {
          source: selectedStudy.source,
          rawStudyId,
          rawType: typeof rawStudyId,
          studyId,
          userId,
          hasSession: !!session?.user?.id,
          platform: Platform.OS,
        });
  
        if (!Number.isFinite(studyId)) {
          Alert.alert('Erro', 'ID de estudo inválido.');
          return;
        }
  
        const { error } = await sb
          .from('saved_notes')
          .delete()
          .eq('id', studyId)
          .eq('user_id', userId);
  
        console.log('DELETE_RESULT', {
          studyId,
          userId,
          error,
        });
  
        if (error) {
          console.log('DELETE_SUPABASE_ERROR', error);
          Alert.alert(
            'Erro ao excluir',
            `${error.message}\n(code: ${(error as any).code ?? '-'})`
          );
          return;
        }
      } else {
        const local = await getLocalStudies();
        const updated = local.filter((s) => toStudyId(s.id) !== toStudyId(selectedStudy.id));
        await saveLocalStudies(updated);
      }
  
      setStudies((prev) =>
        prev.filter((s) => toStudyId(s.id) !== toStudyId(selectedStudy.id))
      );
  
      closeModal();
  
      if (Platform.OS !== 'web') {
        Alert.alert('Excluído', 'Estudo removido com sucesso.');
      }
    } catch (e: any) {
      console.log('DELETE_STUDY_FATAL', e);
      Alert.alert('Erro', e?.message || 'Falha ao excluir.');
    }
  }
  const handleDelete = async () => {
  if (!selectedStudy) return;

  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Tem certeza que deseja apagar este estudo?');
    if (!confirmed) return;

    await performDeleteStudy();
    return;
  }

  Alert.alert('Excluir', 'Tem certeza que deseja apagar este estudo?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Apagar',
      style: 'destructive',
      onPress: () => {
        void performDeleteStudy();
      },
    },
  ]);
};
  const handleSaveChanges = async () => {
    if (!selectedStudy) return;

    try {
      let newContent: string | null = null;
      const nextTitle = String(editTheme || '').trim() || 'Sem Título';

      if (parsedKind === 'envelope') {
        newContent = buildEnvelopeFromEditor({
          selectedStudy,
          parsedEnvelope,
          editTheme: nextTitle,
          editHistory,
          editExegesis,
          editTheology,
          editApplication,
        });
      } else if (parsedKind === 'oldjson') {
        const next: OldJson = {
          ...(parsedOld || {}),
          theme: nextTitle,
          history: editHistory,
          exegesis: editExegesis,
          theology: editTheology,
          application: editApplication,
        };
        newContent = JSON.stringify(next);
      } else {
        newContent = String(editExegesis || '');
      }

      if (selectedStudy.source === 'supabase') {
        const sb = getSupabaseOrNull();
        if (!sb) {
          Alert.alert('Erro', 'Supabase não configurado.');
          return;
        }

        if (!userId) {
          Alert.alert('Login necessário', 'Faça login novamente para editar.');
          return;
        }

        const studyId = Number(selectedStudy.id);
        if (!Number.isFinite(studyId)) {
          Alert.alert('Erro', 'ID de estudo inválido.');
          return;
        }

        const { data, error } = await sb
          .from('saved_notes')
          .update({
            title: nextTitle,
            content: newContent,
            reference: selectedStudy.reference ?? null,
          })
          .eq('id', studyId)
          .eq('user_id', userId)
          .select('id, created_at, title, reference, content, user_id, client_id')
          .single();

        if (error) {
          console.log('UPDATE_SUPABASE_ERROR', error);
          Alert.alert('Erro', error.message);
          return;
        }

        const nextSelected: Study = {
          id: data.id,
          title: data.title || 'Sem Título',
          content: data.content ?? null,
          reference: data.reference ?? null,
          observation: null,
          application: null,
          prayer: null,
          created_at: data.created_at,
          user_id: data.user_id ?? null,
          client_id: data.client_id ?? null,
          source: 'supabase',
        };

        setSelectedStudy(nextSelected);
        setStudies((prev) =>
          prev.map((s) => (toStudyId(s.id) === toStudyId(nextSelected.id) ? nextSelected : s))
        );
      } else {
        const local = await getLocalStudies();
        const updated = local.map((s) =>
          toStudyId(s.id) === toStudyId(selectedStudy.id)
            ? {
                ...s,
                title: nextTitle,
                content: newContent,
                observation: null,
                application: null,
                prayer: null,
              }
            : s
        );

        await saveLocalStudies(updated);

        const nextSelected: Study = {
          ...selectedStudy,
          title: nextTitle,
          content: newContent,
          observation: null,
          application: null,
          prayer: null,
        };

        setSelectedStudy(nextSelected);
        setStudies((prev) =>
          prev.map((s) =>
            toStudyId(s.id) === toStudyId(selectedStudy.id)
              ? {
                  ...s,
                  title: nextTitle,
                  content: newContent,
                  observation: null,
                  application: null,
                  prayer: null,
                }
              : s
          )
        );
      }

      Alert.alert('Sucesso', 'Estudo atualizado!');
      setIsEditing(false);
    } catch (e: any) {
      console.log('SAVE_CHANGES_FATAL', e);
      Alert.alert('Erro', e?.message || 'Falha ao salvar alterações.');
    }
  };

  const createLocalBlankStudy = async () => {
    try {
      const now = new Date().toISOString();
  
      if (userId) {
        const sb = getSupabaseOrNull();
        if (!sb) {
          Alert.alert('Erro', 'Supabase não configurado.');
          return;
        }
  
        const { data, error } = await sb
          .from('saved_notes')
          .insert({
            user_id: userId,
            title: 'Novo Estudo',
            reference: 'Estudo / Esboço',
            content: buildManualSketchEnvelope('Novo Estudo'),
          })
          .select('id')
          .single();
  
        if (error) throw error;
  
        await fetchStudies();
        router.push(`/sketch/${data.id}` as any);
        return;
      }
  
      const local = await getLocalStudies();
      const nextId = generateLocalStudyId(local);
  
      const blank: Study = {
        id: nextId,
        title: 'Novo Estudo',
        content: buildManualSketchEnvelope('Novo Estudo'),
        reference: 'Estudo / Esboço',
        observation: null,
        application: null,
        prayer: null,
        created_at: now,
        source: 'local',
      };
  
      const updated = [blank, ...local];
      await saveLocalStudies(updated);
      setStudies((prev) => [blank, ...prev]);
      router.push(`/sketch/${nextId}` as any);
    } catch (e) {
      console.log('CREATE_STUDY_FATAL', e);
      Alert.alert('Erro', 'Não foi possível criar o estudo.');
    }
  };
  const emptyMessage = useMemo(() => {
    if (!initialized) return 'Carregando sessão...';
    if (userId) return 'Nenhuma análise salva na sua conta ainda.';
    return 'Nenhuma análise local salva ainda.';
  }, [initialized, userId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Meus Estudos</Text>

        <TouchableOpacity onPress={createLocalBlankStudy} style={{ width: 24, alignItems: 'flex-end' }}>
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {loading || !initialized ? (
  <View style={styles.center}>
    <ActivityIndicator size="large" color="#AF52DE" />
  </View>
) : (
  <FlatList
    data={studies}
    keyExtractor={(item) => toStudyId(item.id)}
    contentContainerStyle={{ padding: 20 }}
    ListEmptyComponent={
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={60} color="#ddd" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    }
    renderItem={({ item }) => {
      const tag = getStudyTag(item);

      return (
        <TouchableOpacity style={styles.card} onPress={() => openStudy(item)}>
          <View style={[styles.cardIcon, { backgroundColor: tag.fg }]}>
            <Ionicons
              name={
                tag.key === 'dictionary'
                  ? 'library-outline'
                  : tag.key === 'ai_chapter'
                  ? 'school-outline'
                  : tag.key === 'ai_verse'
                  ? 'flash-outline'
                  : tag.key === 'diary'
                  ? 'journal-outline'
                  : tag.key === 'manual'
                  ? 'create-outline'
                  : 'document-text-outline'
              }
              size={20}
              color="#fff"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || 'Sem Título'}
            </Text>

            <View style={[styles.tagPill, { backgroundColor: tag.bg }]}>
              <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label}</Text>
            </View>

            {!!item.reference && (
              <Text style={styles.cardRef} numberOfLines={1}>
                {item.reference}
              </Text>
            )}

            <Text style={styles.cardDate}>
              {item.created_at}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }}
  />
)}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 40 : 0 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeText}>Fechar</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                {isEditing ? (
                  <TouchableOpacity onPress={handleSaveChanges}>
                    <Text style={styles.saveText}>Salvar</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    {canOpenBible ? (
                      <TouchableOpacity onPress={handleOpenBible} style={styles.actionIcon}>
                        <Ionicons name="book-outline" size={24} color="#34C759" />
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionIcon}>
                      <Ionicons name="create-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShare} style={styles.actionIcon}>
                      <Ionicons name="share-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleDelete} style={styles.actionIcon}>
                      <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={[styles.modalContent, { paddingBottom: 40 + keyboardHeight }]}
            >
              {selectedStudy?.reference ? (
                <View style={[styles.section, { borderLeftColor: '#FF9500' }]}>
                  <Text style={[styles.sectionHeader, { color: '#FF9500' }]}>REFERÊNCIA</Text>
                  <Text style={styles.viewBody}>{selectedStudy.reference}</Text>
                </View>
              ) : null}

              <View style={[styles.section, { borderLeftColor: '#AF52DE' }]}>
                <Text style={[styles.sectionHeader, { color: '#AF52DE' }]}>TEMA CENTRAL</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.inputInline, { fontWeight: '800' }]}
                    value={editTheme}
                    onChangeText={setEditTheme}
                    placeholder="Tema..."
                  />
                ) : (
                  <Text style={[styles.viewBody, { fontWeight: 'bold' }]}>{editTheme}</Text>
                )}
              </View>

              {editHistory ? (
                <View style={[styles.section, { borderLeftColor: '#FF9500' }]}>
                  <Text style={[styles.sectionHeader, { color: '#FF9500' }]}>CONTEXTO HISTÓRICO</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.inputInline, { minHeight: 110 }]}
                      value={editHistory}
                      onChangeText={setEditHistory}
                      multiline
                      textAlignVertical="top"
                      placeholder="Contexto..."
                    />
                  ) : (
                    <Text style={styles.viewBody}>{editHistory}</Text>
                  )}
                </View>
              ) : null}

              <View style={[styles.section, { borderLeftColor: '#007AFF' }]}>
                <Text style={styles.sectionHeader}>EXEGESE / ANÁLISE</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.inputInline, { minHeight: 160 }]}
                    value={editExegesis}
                    onChangeText={setEditExegesis}
                    multiline
                    textAlignVertical="top"
                    placeholder="Exegese..."
                  />
                ) : (
                  <Text style={styles.viewBody}>{editExegesis}</Text>
                )}
              </View>

              {(editTheology || isEditing) ? (
                <View style={[styles.section, { borderLeftColor: '#AF52DE' }]}>
                  <Text style={[styles.sectionHeader, { color: '#AF52DE' }]}>TEOLOGIA</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.inputInline, { minHeight: 110 }]}
                      value={editTheology}
                      onChangeText={setEditTheology}
                      multiline
                      textAlignVertical="top"
                      placeholder="Teologia..."
                    />
                  ) : (
                    <Text style={styles.viewBody}>{editTheology}</Text>
                  )}
                </View>
              ) : null}

              {(editApplication || isEditing) ? (
                <View style={[styles.section, { borderLeftColor: '#34C759' }]}>
                  <Text style={[styles.sectionHeader, { color: '#34C759' }]}>APLICAÇÃO</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.inputInline, { minHeight: 120 }]}
                      value={editApplication}
                      onChangeText={setEditApplication}
                      multiline
                      textAlignVertical="top"
                      placeholder="Aplicação..."
                    />
                  ) : (
                    <Text style={styles.viewBody}>{editApplication}</Text>
                  )}
                </View>
              ) : null}

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
    marginBottom: 6,
  },

  tagText: {
    fontSize: 12,
    fontWeight: '800',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { alignItems: 'center', marginTop: 100, padding: 20 },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#AF52DE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardDate: { fontSize: 12, color: '#888', marginTop: 2 },
  cardRef: { fontSize: 12, color: '#666', marginTop: 2 },
  sourceTag: { fontSize: 11, color: '#AF52DE', marginTop: 6, fontWeight: '700' },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  closeText: { fontSize: 17, color: '#007AFF' },
  saveText: { fontSize: 17, fontWeight: 'bold', color: '#007AFF' },
  modalActions: { flexDirection: 'row', gap: 20 },
  actionIcon: { padding: 5 },
  modalContent: { padding: 20 },

  section: {
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#007AFF',
    marginBottom: 8,
    letterSpacing: 1,
  },

  viewBody: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    textAlign: 'justify',
  },

  inputInline: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    lineHeight: 24,
  },
});