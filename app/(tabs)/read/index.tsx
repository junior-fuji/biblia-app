import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ CAMINHO SUPABASE (Mantido o que funcionou)
import { supabase } from '../../../lib/supabase';

// --- MAPA COMPLETO DE LIVROS ---
const BOOK_MAP: { [key: number]: { name: string, abbrev: string } } = {
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
  65: { name: 'Judas', abbrev: 'Jd' }, 66: { name: 'Apocalipse', abbrev: 'Ap' }
};

type Verse = { id: string; verse: number; text_pt: string; };
type AnalysisData = { theme?: string; exegesis?: string; history?: string; theology?: string; application?: string; };

export default function LeituraScreen() {
  const navigation = useNavigation();
  const { book, chapter } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // LOGICA SEGURA DE ID
  const parseParam = (param: string | string[] | undefined) => {
    if (!param) return 0;
    if (Array.isArray(param)) return parseInt(param[0], 10) || 0;
    return parseInt(param, 10) || 0;
  };

  const numericBookId = parseParam(book) || 1;
  const initialChapter = parseParam(chapter) || 1;

  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chaptersList, setChaptersList] = useState<number[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter);
  const [showGrid, setShowGrid] = useState(false); 
  const [fontSize, setFontSize] = useState(20);

  // IA & AUDIO
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  
  // EDITAR / SALVAR
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const currentBookData = BOOK_MAP[numericBookId] || { name: 'Carregando...', abbrev: '' };
  const displayTitle = currentBookData.name;

  useEffect(() => { return () => { if (sound) sound.unloadAsync(); }; }, [sound]);

  useEffect(() => {
    async function configureAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false, playsInSilentModeIOS: true, staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix, interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true, playThroughEarpieceAndroid: false,
        });
      } catch (e) {}
    }
    configureAudio();
  }, []);

  useEffect(() => {
    async function initBook() {
      if (!numericBookId) return;
      try {
        const { data: max } = await supabase.from('verses').select('chapter').eq('book_id', numericBookId).order('chapter', { ascending: false }).limit(1);
        if (max && max.length > 0) { 
            setTotalChapters(max[0].chapter); 
            setChaptersList(Array.from({ length: max[0].chapter }, (_, i) => i + 1)); 
        }
      } catch (e) { console.log(e); }
    }
    initBook();
  }, [numericBookId]);

  useEffect(() => { if (numericBookId > 0) fetchVerses(numericBookId, selectedChapter); }, [selectedChapter, numericBookId]);

  async function fetchVerses(bId: number, cap: number) {
    setLoading(true);
    try {
        const { data, error } = await supabase.from('verses').select('id, verse, text_pt').eq('book_id', bId).eq('chapter', cap).order('verse', { ascending: true });
        if (error) throw error;
        setVerses(data || []); 
    } catch (error) {
        console.error("Erro busca:", error);
    } finally {
        setLoading(false);
    }
  }

  const handleShare = async () => {
    let message = "";
    if (isEditing) {
      message = `*ANÁLISE (Minha Nota)*\n\n${editedText}`;
    } else if (analysisData) {
      message = `*ANÁLISE: ${aiTitle}*\n\n📖 *Tema:* ${analysisData.theme}\n🔎 *Exegese:* ${analysisData.exegesis}\n🏛️ *Histórico:* ${analysisData.history}\n✝️ *Teologia:* ${analysisData.theology}\n🌱 *Aplicação:* ${analysisData.application}`;
    }
    try { await Share.share({ message }); } catch (error) { Alert.alert("Erro", "Não foi possível compartilhar."); }
  };

  const handleCopy = async () => {
    const text = isEditing ? editedText : JSON.stringify(analysisData, null, 2);
    await Clipboard.setStringAsync(text);
    Alert.alert("Copiado!", "Texto copiado.");
  };

  const handleSave = async () => {
    if (!analysisData && !editedText) return;
    setSavingNote(true);
    let contentToSave = "";
    if (isEditing) {
      contentToSave = editedText;
    } else {
      contentToSave = JSON.stringify(analysisData);
    }
    const { error } = await supabase.from('saved_notes').insert({
        title: aiTitle, reference: `${displayTitle} ${selectedChapter}`, content: contentToSave
    });
    setSavingNote(false);
    if (error) { Alert.alert("Erro", "Não foi possível salvar."); } 
    else { Alert.alert("Sucesso!", "Análise salva."); setIsEditing(false); }
  };

  // ✅ CORREÇÃO: FORMATADOR DE EDIÇÃO
  // Agora ele cria um texto bonito e espaçado quando você clica em Editar
  const handleEdit = () => {
    if (!analysisData) return;
    
    const safe = (txt: any) => {
       if (!txt) return "Sem informação.";
       return typeof txt === 'object' ? Object.values(txt).join(' ') : txt;
    };

    // Note os \n\n para pular linhas e os emojis para organizar
    const textVersion = 
      `📌 TEMA CENTRAL:\n${safe(analysisData.theme)}\n\n` +
      `🏛️ CONTEXTO HISTÓRICO:\n${safe(analysisData.history)}\n\n` +
      `🔎 EXEGESE DETALHADA:\n${safe(analysisData.exegesis)}\n\n` +
      `✝️ TEOLOGIA:\n${safe(analysisData.theology)}\n\n` +
      `🌱 APLICAÇÃO PRÁTICA:\n${safe(analysisData.application)}`;
      
    setEditedText(textVersion); 
    setIsEditing(true);
  };

  const speakWithOpenAI = async () => {
    if (!analysisData && !isEditing) return;
    if (sound) {
      if (isSpeaking) { await sound.pauseAsync(); setIsSpeaking(false); } 
      else { await sound.playAsync(); setIsSpeaking(true); }
      return;
    }
    try {
      setAudioLoading(true);
      const safeText = (txt: any) => typeof txt === 'object' ? JSON.stringify(txt) : txt;
      let textToSpeak = isEditing ? editedText : `Análise Teológica. Tema: ${safeText(analysisData?.theme)}. Exegese: ${safeText(analysisData?.exegesis)}. Aplicação: ${safeText(analysisData?.application)}`;

      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: textToSpeak }),
      });

      if (!response.ok) throw new Error("Erro no servidor de áudio");

      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const uriResult = reader.result as string;
        if (Platform.OS === 'web') {
           const { sound: newSound } = await Audio.Sound.createAsync({ uri: uriResult }, { shouldPlay: true });
           setSound(newSound); setIsSpeaking(true);
           newSound.setOnPlaybackStatusUpdate((s: any) => { if (s.didJustFinish) { setIsSpeaking(false); newSound.unloadAsync(); setSound(null); }});
        } else {
           const base64data = uriResult.split(',')[1];
           // @ts-ignore
           const uri = (FileSystem.cacheDirectory || '') + 'speech_analysis.mp3';
           await FileSystem.writeAsStringAsync(uri, base64data, { encoding: 'base64' });
           const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
           setSound(newSound); setIsSpeaking(true);
           newSound.setOnPlaybackStatusUpdate((s: any) => { if (s.didJustFinish) { setIsSpeaking(false); newSound.unloadAsync(); setSound(null); }});
        }
      };
    } catch (error: any) { 
        Alert.alert("Erro de Áudio", "Não foi possível gerar o áudio."); 
    } finally { 
        setAudioLoading(false); 
    }
  };

  const callAI = async (prompt: string, title: string) => {
    setAiTitle(title); 
    setAnalysisData(null); 
    setIsEditing(false); 
    stopSpeaking(); 
    setAiModalVisible(true); 
    setAiLoading(true);
    
    // ✅ CORREÇÃO: PROMPT TURBO DETALHADO
    // Manda a IA ser prolixa e detalhista
    const SYSTEM_PROMPT = `
    ATUE COMO: Um Teólogo Reformado Sênior, PhD em Exegese Bíblica e Linguística.
    TAREFA: Analisar o texto bíblico fornecido com profundidade acadêmica e pastoral.
    
    REGRAS OBRIGATÓRIAS:
    1. NÃO RESUMA. Escreva parágrafos longos, densos e explicativos.
    2. Na Exegese, analise as palavras chave no original (Hebraico/Grego), colocando a transliteração e o sentido profundo.
    3. Na Teologia, conecte com a Grande História da Redenção (Cristocentrismo).
    4. Seja didático mas profundo, como um comentário bíblico de referência.
    
    ESTRUTURA JSON (Responda APENAS JSON):
    {
      "theme": "Resumo robusto do tema central (mínimo 3 frases).",
      "history": "Contexto histórico completo: autor, data, situação política e destinatários.",
      "exegesis": "Análise detalhada versículo a versículo ou das palavras-chave. Mínimo 150 palavras.",
      "theology": "Doutrinas fundamentais (Justificação, Santificação, etc) presentes no texto.",
      "application": "3 aplicações práticas, desafiadoras e específicas para a vida cristã hoje."
    }
    `;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      if (data.choices) {
        let content = data.choices[0].message.content;
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            const cleanJson = content.substring(firstBrace, lastBrace + 1);
            try {
                setAnalysisData(JSON.parse(cleanJson));
            } catch (e) {
                setAnalysisData({ theme: "Erro na leitura", exegesis: "A IA retornou um formato inválido." });
            }
        } else {
             setAnalysisData({ theme: "Erro", exegesis: "A IA não retornou um JSON válido." });
        }
      }
    } catch (error) { 
        console.error(error);
        setAnalysisData({ theme: "Erro de Conexão", exegesis: "Não foi possível conectar ao servidor de Teologia." });
    } finally { 
        setAiLoading(false); 
    }
  };
  
  const stopSpeaking = async () => { if (sound) { await sound.stopAsync(); await sound.unloadAsync(); setSound(null); setIsSpeaking(false); } };
  const goNext = () => { if (selectedChapter < totalChapters) setSelectedChapter(selectedChapter + 1); };
  const goPrev = () => { if (selectedChapter > 1) setSelectedChapter(selectedChapter - 1); };
  const analyzeChapter = () => callAI(`Analise profundamente o Capítulo ${selectedChapter} de ${displayTitle}.`, `Capítulo ${selectedChapter}`);
  const analyzeVerse = (v: Verse) => callAI(`Faça uma exegese profunda do Versículo: "${v.text_pt}" (Livro: ${displayTitle}, Cap: ${selectedChapter}, Verso: ${v.verse}).`, `Verso ${v.verse}`);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true, headerBackTitle: "Livros",
      headerTitle: () => (
        <TouchableOpacity onPress={() => setShowGrid(!showGrid)} style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>{displayTitle} {selectedChapter} {showGrid ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -8 }}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
            <Text style={{ fontSize: 17, color: '#007AFF' }}>Livros</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
           <TouchableOpacity onPress={analyzeChapter} style={styles.iconButton}><Ionicons name="school" size={24} color="#AF52DE" /></TouchableOpacity>
           <TouchableOpacity onPress={() => setFontSize(p => Math.max(12, p - 2))} style={styles.fontButton}><Ionicons name="remove" size={24} color="#007AFF" /></TouchableOpacity>
           <TouchableOpacity onPress={() => setFontSize(p => Math.min(40, p + 2))} style={styles.fontButton}><Ionicons name="add" size={24} color="#007AFF" /></TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, displayTitle, selectedChapter, showGrid]);

  const InfoCard = ({ title, text, color, icon }: any) => {
    if (!text) return null;
    let safeContent = text;
    if (typeof text === 'object') {
        safeContent = Object.values(text).join('. ');
        if (safeContent === '[object Object]' || safeContent === '') {
            safeContent = JSON.stringify(text).replace(/[\{\}"]/g, '').replace(/:/g, ': ');
        }
    }
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.cardBar, { backgroundColor: color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}><Ionicons name={icon} size={20} color={color} style={{marginRight: 8}} /><Text style={[styles.cardTitle, { color: color }]}>{title}</Text></View>
          <Text style={styles.cardBody}>{safeContent}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showGrid && (
        <View style={styles.gridOverlay}>
          <FlatList data={chaptersList} key="grid" numColumns={5} keyExtractor={i => i.toString()} contentContainerStyle={styles.gridContainer}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.chapterButton, item === selectedChapter && styles.activeChapter]} onPress={() => { setSelectedChapter(item); setShowGrid(false); }}>
                <Text style={[styles.chapterText, item === selectedChapter && styles.activeChapterText]}>{item}</Text>
              </TouchableOpacity>
            )} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        {loading ? <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} /> : (
            verses.length === 0 ? (
                <View style={{padding: 40, alignItems: 'center'}}>
                    <Text style={{fontSize: 16, color: '#666', textAlign: 'center'}}>
                        Nenhum versículo encontrado.{'\n'}
                        Tente recarregar ou verifique sua conexão.
                    </Text>
                </View>
            ) : (
                <FlatList data={verses} key="text" keyExtractor={i => i.id.toString()} contentContainerStyle={styles.textContainer} showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                    <TouchableOpacity activeOpacity={0.7} onLongPress={() => analyzeVerse(item)} style={styles.verseBox}>
                        <Text style={[styles.verseText, { fontSize: fontSize }]}>
                        <Text style={[styles.verseNumber, { fontSize: fontSize * 0.7 }]}>{item.verse}  </Text>
                        {item.text_pt}
                        </Text>
                    </TouchableOpacity>
                    )} />
            )
        )}
      </View>

      <SafeAreaView style={styles.bottomNavSafe} edges={['bottom']}>
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity style={[styles.navButton, selectedChapter <= 1 && styles.disabledButton]} onPress={goPrev} disabled={selectedChapter <= 1}><Ionicons name="chevron-back" size={20} color={selectedChapter <= 1 ? "#ccc" : "#fff"} /><Text style={[styles.navButtonText, selectedChapter <= 1 && styles.disabledText]}> Anterior</Text></TouchableOpacity>
          <Text style={styles.chapterIndicator}>{selectedChapter} / {totalChapters}</Text>
          <TouchableOpacity style={[styles.navButton, selectedChapter >= totalChapters && styles.disabledButton]} onPress={goNext} disabled={selectedChapter >= totalChapters}><Text style={[styles.navButtonText, selectedChapter >= totalChapters && styles.disabledText]}>Próximo </Text><Ionicons name="chevron-forward" size={20} color={selectedChapter >= totalChapters ? "#ccc" : "#fff"} /></TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal animationType="slide" visible={aiModalVisible} onRequestClose={() => { setAiModalVisible(false); stopSpeaking(); }}>
        <View style={{ flex: 1, backgroundColor: '#F2F2F7', paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 20 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setAiModalVisible(false); setIsEditing(false); stopSpeaking(); }}>
                <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
            <View style={styles.headerActions}>
                <TouchableOpacity onPress={speakWithOpenAI} style={styles.playActionBtn} disabled={audioLoading}>
                    {audioLoading ? <ActivityIndicator size="small" color="#007AFF"/> : 
                        <>
                        <Ionicons name={isSpeaking ? "pause-circle" : "play-circle"} size={32} color="#007AFF" />
                        <Text style={styles.playLabel}>Ouvir</Text>
                        </>
                    }
                </TouchableOpacity>
                {isEditing ? (
                    <TouchableOpacity onPress={handleSave} style={{backgroundColor:'#007AFF', paddingHorizontal:12, paddingVertical:8, borderRadius:15}}>
                        {savingNote ? <ActivityIndicator color="#fff" size="small"/> : <Text style={{color:'#fff', fontWeight:'bold'}}>Salvar Edição</Text>}
                    </TouchableOpacity>
                ) : (
                    <>
                    <TouchableOpacity onPress={handleSave} style={styles.actionIcon}>
                        {savingNote ? <ActivityIndicator size="small" color="#007AFF"/> : <Ionicons name="save-outline" size={26} color="#007AFF" />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleEdit} style={styles.actionIcon}><Ionicons name="pencil-outline" size={26} color="#007AFF" /></TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={styles.actionIcon}><Ionicons name="share-outline" size={26} color="#007AFF" /></TouchableOpacity>
                    </>
                )}
            </View>
          </View>
          
          {aiLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#AF52DE" /><Text style={{ marginTop: 20, color: '#666', fontSize: 16 }}>Consultando PhD em Teologia...</Text></View>
          ) : (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {isEditing ? (
                    <TextInput 
                        style={styles.textEditor} 
                        multiline 
                        value={editedText} 
                        onChangeText={setEditedText} 
                        placeholder="Edite sua anotação aqui..."
                        textAlignVertical="top"
                    />
                ) : (
                    <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
                      <Text style={styles.analysisSubject}>{aiTitle}</Text>
                      <InfoCard title="TEMA CENTRAL" icon="bookmark" color="#1C1C1E" text={analysisData?.theme} />
                      <InfoCard title="CONTEXTO HISTÓRICO" icon="time" color="#FF9500" text={analysisData?.history} />
                      <InfoCard title="EXEGESE & LINGUÍSTICA" icon="search" color="#007AFF" text={analysisData?.exegesis} />
                      <InfoCard title="TEOLOGIA SISTEMÁTICA" icon="book" color="#AF52DE" text={analysisData?.theology} />
                      <InfoCard title="APLICAÇÃO PRÁTICA" icon="leaf" color="#34C759" text={analysisData?.application} />
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitleText: { fontSize: 17, fontWeight: '700' },
  headerRightContainer: { flexDirection: 'row', paddingRight: 5, alignItems: 'center' },
  fontButton: { padding: 5, marginLeft: 5 },
  iconButton: { padding: 5, marginRight: 10 },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 10, padding: 10 },
  gridContainer: { alignItems: 'center', paddingBottom: 40 },
  chapterButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', margin: 8 },
  activeChapter: { backgroundColor: '#007AFF' },
  chapterText: { fontSize: 16, fontWeight: '600' },
  activeChapterText: { color: '#fff' },
  textContainer: { padding: 20, paddingBottom: 20 },
  verseBox: { marginBottom: 15 },
  verseText: { lineHeight: 32, color: '#222', textAlign: 'justify' },
  verseNumber: { fontWeight: 'bold', color: '#007AFF' },
  bottomNavSafe: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  bottomNavContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  navButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  disabledButton: { backgroundColor: '#f0f0f0' },
  navButtonText: { color: '#fff', fontWeight: '600' },
  disabledText: { color: '#ccc' },
  chapterIndicator: { fontSize: 14, color: '#666' },
  modalHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingBottom: 15, 
      backgroundColor: '#F2F2F7', 
      borderBottomWidth: 1, 
      borderBottomColor: '#E5E5EA' 
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  playActionBtn: { alignItems: 'center', justifyContent: 'center', marginRight: 15 }, 
  playLabel: { fontSize: 9, color: '#007AFF', fontWeight: '600', marginTop: -2 },
  actionIcon: { marginLeft: 15, padding: 0 },
  closeText: { fontSize: 17, color: '#007AFF', fontWeight: '500' },
  modalBody: { flex: 1, padding: 20 },
  textEditor: { flex: 1, padding: 20, fontSize: 16, lineHeight: 24, backgroundColor: '#fff', textAlignVertical: 'top', color: '#333' },
  analysisSubject: { fontSize: 22, fontWeight: '800', color: '#000', marginBottom: 25, textAlign: 'center', lineHeight: 28 },
  cardContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardBar: { width: 5 }, 
  cardContent: { flex: 1, padding: 15, paddingVertical: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { fontSize: 16, lineHeight: 24, color: '#333', textAlign: 'justify' }
});