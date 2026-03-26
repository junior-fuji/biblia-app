import {
  deleteLocalNote,
  getAllNotes,
  SavedNote,
  saveLocalNote,
  updateLocalNote,
} from '@/lib/studiesStorage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Study = {
  id: string;
  title: string;
  content: string | null;
  reference: string | null;
  observation: string | null;
  application: string | null;
  prayer: string | null;
  created_at: string;
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
    original_terms?: string;
  } | null;
  raw?: string | null;
};

type ParsedKind = 'envelope' | 'oldjson' | 'plain';

function safeParseJson(s: string): any | null {
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

function toStudy(note: SavedNote): Study {
  return {
    id: String(note.id),
    title: String(note.title ?? 'Sem Título'),
    reference: note.reference != null ? String(note.reference) : null,
    content: note.content != null ? String(note.content) : '',
    observation: null,
    application: null,
    prayer: null,
    created_at: note.created_at || new Date().toISOString(),
  };
}

function generateLocalStudyId() {
  return Date.now().toString();
}

export default function StudiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

  async function fetchStudies() {
    setLoading(true);
    try {
      const notes = await getAllNotes();
      setStudies(notes.map(toStudy));
    } catch (e) {
      console.error('Erro ao buscar estudos:', e);
      setStudies([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudies();
  }, []);

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

    const content = (study.content || '').trim();

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
      pathname: '/read/[book]',
      params: {
        book: String(openRef.book_id),
        chapter: String(openRef.chapter),
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
      { text: 'Cancelar' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLocalNote(selectedStudy.id);
            setStudies((prev) => prev.filter((s) => s.id !== selectedStudy.id));
            setModalVisible(false);
            setSelectedStudy(null);
          } catch (e) {
            console.error('Erro ao excluir:', e);
            Alert.alert('Erro', 'Falha ao excluir.');
          }
        },
      },
    ]);
  };

  const handleSaveChanges = async () => {
    if (!selectedStudy) return;

    try {
      let newContent = '';

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

      await updateLocalNote(selectedStudy.id, {
        title: editTheme,
        reference: selectedStudy.reference ?? '',
        content: newContent,
      });

      const nextSelected: Study = {
        ...selectedStudy,
        title: editTheme,
        content: newContent,
        observation: null,
        application: null,
        prayer: null,
      };

      setSelectedStudy(nextSelected);

      setStudies((prev) =>
        prev.map((s) =>
          s.id === selectedStudy.id
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
      console.error('Erro ao salvar:', e);
      Alert.alert('Erro', e?.message || 'Falha ao salvar alterações.');
    }
  };

  const createLocalBlankStudy = async () => {
    try {
      const now = new Date().toISOString();

      const blank: SavedNote = {
        id: generateLocalStudyId(),
        title: 'Novo Estudo',
        reference: '',
        content: '',
        created_at: now,
      };

      const saved = await saveLocalNote(blank);
      const nextStudy = toStudy(saved);

      setStudies((prev) => [nextStudy, ...prev]);
    } catch (e) {
      console.error('Erro ao criar estudo:', e);
      Alert.alert('Erro', 'Não foi possível criar o estudo.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />

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
          keyExtractor={(item) => String(item.id)}
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
                {!!item.reference && (
                  <Text style={styles.cardReference} numberOfLines={1}>
                    {item.reference}
                  </Text>
                )}
                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
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
  cardReference: { fontSize: 12, color: '#666', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#888', marginTop: 4 },

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

  viewBody: { fontSize: 16, lineHeight: 26, color: '#333', textAlign: 'justify' },

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