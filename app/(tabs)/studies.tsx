import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  id: number;
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

/** =========================
 *  Local storage (SEM login)
 ========================= */
const LOCAL_KEY = 'LOCAL_SAVED_NOTES_V1';

function toLocalId(studyId: number) {
  return String(studyId);
}

function generateLocalStudyId(existing: Study[]) {
  const maxId = existing.reduce((acc, s) => Math.max(acc, Number(s.id) || 0), 0);
  return maxId + 1;
}

async function getLocalStudies(): Promise<Study[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Study[];
  } catch {
    return [];
  }
}

async function saveLocalStudies(data: Study[]) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

export default function StudiesScreen() {
  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  function normalizeId(v: any): number {
    // id bigint pode vir como number ou string
    const n = typeof v === 'number' ? v : Number(String(v));
    return Number.isFinite(n) ? n : Date.now();
  }
  
  function normalizeCreatedAt(v: any): string {
    if (!v) return new Date().toISOString();
  
    const s = String(v).trim();
  
    // Formato vindo do Supabase no SQL editor:
    // "2026-01-27 15:44:08.115015+00"
    // Converte para ISO:
    // "2026-01-27T15:44:08.115015Z"
    const isoish = s.includes(' ') ? s.replace(' ', 'T') : s;
    const z = isoish.endsWith('+00') ? isoish.replace(/\+00$/, 'Z') : isoish;
  
    const d = new Date(z);
    if (Number.isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  }
  async function importJsonToLocal() {
    try {
      const raw = importText.trim();
      if (!raw) {
        Alert.alert('Importar', 'Cole o JSON exportado do Supabase.');
        return;
      }
  
      const parsed = JSON.parse(raw);
  
      if (!Array.isArray(parsed)) {
        Alert.alert('Importar', 'O JSON precisa ser um array de registros.');
        return;
      }
  
      // Converte para o formato local esperado
      const imported: Study[] = parsed.map((r: any) => ({
        id: normalizeId(r.id),
        title: String(r.title ?? 'Sem Título'),
        reference: r.reference != null ? String(r.reference) : null,
        content: r.content != null ? String(r.content) : '',
        // seu app usa só content + title + reference; campos legados ficam null
        observation: null,
        application: null,
        prayer: null,
        created_at: normalizeCreatedAt(r.created_at),

      }));
  
      // Ordena por data desc (igual você faz no fetch)
      imported.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
      await saveLocalStudies(imported);
      setStudies(imported);
  
      setImportVisible(false);
      setImportText('');
  
      Alert.alert('Importado', `Foram importados ${imported.length} estudos para o modo local.`);
    } catch (e: any) {
      console.error('Import error:', e);
      Alert.alert('Erro', e?.message || 'Falha ao importar JSON.');
    }
  }
  
  // teclado
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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

  // campos editáveis
  const [editTheme, setEditTheme] = useState('');
  const [editHistory, setEditHistory] = useState('');
  const [editExegesis, setEditExegesis] = useState('');
  const [editTheology, setEditTheology] = useState('');
  const [editApplication, setEditApplication] = useState('');

  // preservar formato original ao salvar
  const [parsedKind, setParsedKind] = useState<ParsedKind>('plain');
  const [parsedEnvelope, setParsedEnvelope] = useState<Envelope | null>(null);
  const [parsedOld, setParsedOld] = useState<OldJson | null>(null);

  // ref estruturada para “abrir na Bíblia”
  const [openRef, setOpenRef] = useState<{
    book_id: number;
    chapter: number;
    verse?: number | null;
    label?: string;
  } | null>(null);

  async function fetchStudies() {
    setLoading(true);
    try {
      const local = await getLocalStudies();
      const sorted = [...local].sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return tb - ta;
      });
      setStudies(sorted);
    } catch (e) {
      console.error('Erro ao buscar local:', e);
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

    // concatena colunas antigas (se existirem)
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
            const local = await getLocalStudies();
            const updated = local.filter((s) => toLocalId(s.id) !== toLocalId(selectedStudy.id));
            await saveLocalStudies(updated);

            // update otimista
            setStudies((prev) => prev.filter((s) => s.id !== selectedStudy.id));
            setModalVisible(false);
            setSelectedStudy(null);
          } catch (e) {
            console.error('Erro ao excluir local:', e);
            Alert.alert('Erro', 'Falha ao excluir.');
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

      const local = await getLocalStudies();
      const updated = local.map((s) =>
        toLocalId(s.id) === toLocalId(selectedStudy.id)
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

      // update otimista
      const nextSelected: Study = { ...selectedStudy, title: editTheme, content: newContent };
      setSelectedStudy(nextSelected);

      setStudies((prev) => {
        const idx = prev.findIndex((s) => s.id === selectedStudy.id);
        if (idx < 0) return prev;
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          title: editTheme,
          content: newContent,
          observation: null,
          application: null,
          prayer: null,
        };
        return copy;
      });

      Alert.alert('Sucesso', 'Estudo atualizado!');
      setIsEditing(false);
    } catch (e: any) {
      console.error('Erro ao salvar local:', e);
      Alert.alert('Erro', e?.message || 'Falha ao salvar alterações.');
    }
  };

  /** Criar um estudo local "vazio" */
  const createLocalBlankStudy = async () => {
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
    };

    const updated = [blank, ...local];
    await saveLocalStudies(updated);

    // update otimista
    setStudies((prev) => [blank, ...prev]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
  <TouchableOpacity
    onPress={() => setImportVisible(true)}
    style={{ width: 24, alignItems: 'flex-end' }}
  >
    <Ionicons name="download-outline" size={24} color="#000" />
  </TouchableOpacity>

  <TouchableOpacity onPress={createLocalBlankStudy} style={{ width: 24, alignItems: 'flex-end' }}>
    <Ionicons name="add" size={24} color="#000" />
  </TouchableOpacity>
</View>


        <Text style={styles.headerTitle}>Meus Estudos</Text>

        <TouchableOpacity onPress={createLocalBlankStudy} style={{ width: 24, alignItems: 'flex-end' }}>
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#AF52DE" />
        </View>
      ) : (
        <FlatList
          data={studies}
          keyExtractor={(item) => item.id.toString()}
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
                <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL */}
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
              <Modal visible={importVisible} animationType="slide" onRequestClose={() => setImportVisible(false)}>
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: '#fff' }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
  >
    <View style={{ paddingTop: Platform.OS === 'ios' ? 40 : 0 }}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => setImportVisible(false)}>
          <Text style={styles.closeText}>Fechar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={importJsonToLocal}>
          <Text style={styles.saveText}>Importar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: '700', marginBottom: 10 }}>
          Cole aqui o JSON exportado do Supabase
        </Text>

        <TextInput
          value={importText}
          onChangeText={setImportText}
          placeholder='Ex.: [{"id":1,"created_at":"...","title":"...","reference":"...","content":"..."}]'
          multiline
          textAlignVertical="top"
          style={[
            styles.inputInline,
            { minHeight: 260, fontSize: 13, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Menlo' : undefined },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={{ color: '#666', marginTop: 10, fontSize: 12, lineHeight: 18 }}>
          Dica: no Supabase, exporte as colunas id, created_at, title, reference, content.  
          O campo content pode conter JSON (Envelope/OldJson) e será preservado.
        </Text>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
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
  cardDate: { fontSize: 12, color: '#888' },

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
