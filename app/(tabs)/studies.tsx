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
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

type Envelope = {
  version?: number;
  type?: 'chapter' | 'verse';
  ref?: {
    book_id?: number;
    chapter?: number;
    verse?: number | null;
    label?: string;
  };
  title?: string;
  analysis?: {
    theme?: string;
    history?: string;
    exegesis?: string;
    theology?: string;
    application?: string;
  } | null;
  raw?: string | null;
};

type ParsedKind = 'envelope' | 'oldjson' | 'plain';

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
  } catch {
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
    ('ref' in obj || 'analysis' in obj) &&
    ('version' in obj || 'type' in obj)
  );
}

function isOldJson(obj: any): obj is OldJson {
  return obj && typeof obj === 'object' && ('theme' in obj || 'exegesis' in obj || 'application' in obj);
}

export default function StudiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();

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
    setLoading(true);
    try {
      const sb = getSupabaseOrNull();
      const userId = session?.user?.id;

      if (sb && userId) {
        const { data, error } = await sb
          .from('saved_notes')
          .select('id, created_at, title, reference, content, user_id, client_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('FETCH_STUDIES_SUPABASE_ERROR', error);
        } else {
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
          setLoading(false);
          return;
        }
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
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  useFocusEffect(
    useCallback(() => {
      fetchStudies();
    }, [fetchStudies])
  );

  const openStudy = (study: Study) => {
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
    } else {
      setParsedKind('plain');
      exegesis = study.content || '';
    }

    if (study.observation) {
      exegesis = exegesis ? `${exegesis}\n\n[Obs]: ${study.observation}` : study.observation;
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
    } catch {}
  };

  const handleDelete = async () => {
    if (!selectedStudy) return;

    Alert.alert('Excluir', 'Tem certeza que deseja apagar este estudo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (selectedStudy.source === 'supabase') {
              const sb = getSupabaseOrNull();
              if (!sb) {
                Alert.alert('Erro', 'Supabase não configurado.');
                return;
              }

              const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
              if (sessionErr) {
                console.log('DELETE_SESSION_ERROR', sessionErr);
                Alert.alert('Erro', sessionErr.message);
                return;
              }

              const userId = sessionData.session?.user?.id;
              if (!userId) {
                Alert.alert('Login necessário', 'Faça login novamente para excluir.');
                return;
              }

              const studyId = String(selectedStudy.id);

              const { error, count } = await sb
                .from('saved_notes')
                .delete({ count: 'exact' })
                .eq('id', studyId)
                .eq('user_id', userId);

              if (error) {
                console.log('DELETE_SUPABASE_ERROR', error);
                Alert.alert('Erro ao excluir', `${error.message}\n(code: ${(error as any).code ?? '-'})`);
                return;
              }

              console.log('DELETE_SUPABASE_OK', { studyId, userId, count });

              if (!count || count < 1) {
                Alert.alert('Aviso', 'Nenhum registro foi removido. Verifique a policy DELETE no Supabase.');
                return;
              }
            } else {
              const local = await getLocalStudies();
              const updated = local.filter((s) => toStudyId(s.id) !== toStudyId(selectedStudy.id));
              await saveLocalStudies(updated);
            }

            setStudies((prev) => prev.filter((s) => toStudyId(s.id) !== toStudyId(selectedStudy.id)));
            setModalVisible(false);
            setSelectedStudy(null);

            fetchStudies();
          } catch (e: any) {
            console.log('DELETE_STUDY_FATAL', e);
            Alert.alert('Erro', e?.message || 'Falha ao excluir.');
          }
        },
      },
    ]);
  };

  const handleSaveChanges = async () => {
    if (!selectedStudy) return;

    try {
      let newContent: string | null = null;

      if (parsedKind === 'envelope' && parsedEnvelope) {
        const next: Envelope = {
          ...parsedEnvelope,
          title: editTheme,
          analysis: {
            ...(parsedEnvelope.analysis || {}),
            theme: editTheme,
            history: editHistory,
            exegesis: editExegesis,
            theology: editTheology,
            application: editApplication,
          },
        };
        newContent = JSON.stringify(next);
      } else if (parsedKind === 'oldjson') {
        const next: OldJson = {
          ...(parsedOld || {}),
          theme: editTheme,
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

        const { error } = await sb
          .from('saved_notes')
          .update({
            title: editTheme,
            content: newContent,
          })
          .eq('id', selectedStudy.id);

        if (error) {
          console.log('UPDATE_SUPABASE_ERROR', error);
          Alert.alert('Erro', error.message);
          return;
        }
      } else {
        const local = await getLocalStudies();
        const updated = local.map((s) =>
          toStudyId(s.id) === toStudyId(selectedStudy.id)
            ? {
                ...s,
                title: editTheme,
                content: newContent,
                observation: null,
                application: null,
                prayer: null,
              }
            : s
        );
        await saveLocalStudies(updated);
      }

      const nextSelected: Study = { ...selectedStudy, title: editTheme, content: newContent };
      setSelectedStudy(nextSelected);

      setStudies((prev) =>
        prev.map((s) =>
          toStudyId(s.id) === toStudyId(selectedStudy.id)
            ? {
                ...s,
                title: editTheme,
                content: newContent,
                observation: null,
                application: null,
                prayer: null,
              }
            : s
        )
      );

      Alert.alert('Sucesso', 'Estudo atualizado!');
      setIsEditing(false);
    } catch (e: any) {
      console.log('SAVE_CHANGES_FATAL', e);
      Alert.alert('Erro', e?.message || 'Falha ao salvar alterações.');
    }
  };

  const createLocalBlankStudy = async () => {
    try {
      const local = await getLocalStudies();
      const nextId = generateLocalStudyId(local);
      const now = new Date().toISOString();

      const blank: Study = {
        id: nextId,
        title: 'Novo Estudo',
        content: '',
        reference: null,
        observation: null,
        application: null,
        prayer: null,
        created_at: now,
        source: 'local',
      };

      const updated = [blank, ...local];
      await saveLocalStudies(updated);
      setStudies((prev) => [blank, ...prev]);
    } catch (e) {
      console.log('CREATE_LOCAL_STUDY_FATAL', e);
      Alert.alert('Erro', 'Não foi possível criar o estudo.');
    }
  };

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

      {loading ? (
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
              <Text style={styles.emptyText}>Nenhuma análise salva ainda.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openStudy(item)}>
              <View style={styles.cardIcon}>
                <Ionicons name="document-text" size={24} color="#fff" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title || 'Sem Título'}
                </Text>

                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>

                {!!item.reference && (
                  <Text style={styles.cardRef} numberOfLines={1}>
                    {item.reference}
                  </Text>
                )}
              </View>

              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? 40 : 0 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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

              {editTheology ? (
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

              {editApplication ? (
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
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 10 },

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
  cardRef: { fontSize: 12, color: '#666', marginTop: 4 },

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