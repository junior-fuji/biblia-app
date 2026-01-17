import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../lib/supabase'; // Verifique se o caminho está correto

// Tipo para estruturar a resposta da IA
type AIAnalysisData = {
  theme: string;
  exegesis: string;
  context: string;
  theology: string;
  application: string;
};

export default function AIAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(null);
  const [rawText, setRawText] = useState(''); 
  const [fontSize, setFontSize] = useState(16);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAIAnalysis();
  }, []);

  async function fetchAIAnalysis() {
    setLoading(true);
    setAnalysisData(null);
    setRawText('');

    try {
      // 1. Contexto (Versículo ou Capítulo)
      const isVerseAnalysis = params.mode === 'verse';
      const promptContext = isVerseAnalysis 
        ? `Versículo Específico: Livro de ${params.bookName}, Capítulo ${params.chapter}, Versículo ${params.verse}. Texto: "${params.text}"`
        : `Capítulo Inteiro: Livro de ${params.bookName}, Capítulo ${params.chapter}`;

      // 2. O Prompt Poderoso (Enviamos isso para o servidor)
      const systemPrompt = `
        Você é um teólogo reformado sênior, historiador bíblico e especialista em línguas originais.
        Sua tarefa é escrever um comentário bíblico PROFUNDO e DETALHADO sobre: ${promptContext}.

        REGRA DE OURO: NÃO RESUMA. O usuário quer estudar a fundo. Escreva parágrafos completos.

        Responda EXCLUSIVAMENTE com este JSON válido (sem markdown):
        {
          "theme": "Uma frase teológica impactante e robusta que defina a essência do texto.",
          "exegesis": "Faça uma análise minuciosa. Cite palavras-chave no original (Hebraico ou Grego), COLOQUE A TRANSLITERAÇÃO (pronúncia) ENTRE PARÊNTESES ao lado da palavra original e seus significados. Explique a gramática.",
          "context": "Detelhe o cenário histórico, político e cultural. Quem era o rei? Qual era a crise? Quem é o público original?",
          "theology": "Teologia Bíblica: Como esse texto se conecta com a Grande História da Redenção? Onde vemos Cristo?",
          "application": "3 lições práticas, duras e desafiadoras para a igreja contemporânea. Evite clichês."
        }
      `;

      console.log("Iniciando análise segura via Vercel...");

      // ⚠️ AQUI ESTÁ A MUDANÇA: Chamada Segura ao Backend ⚠️
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Não precisa de Authorization aqui, o servidor já sabe a senha
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt }, // O servidor vai ler isso e obedecer
            { role: "user", content: "Faça a análise agora." }
          ]
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Tratamento da resposta
      if (data.choices && data.choices.length > 0) {
        let aiResponse = data.choices[0].message.content;
        
        // Limpeza de segurança para garantir JSON puro
        aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        // Tenta achar o JSON dentro do texto (caso a IA fale algo antes)
        const firstBrace = aiResponse.indexOf('{');
        const lastBrace = aiResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            aiResponse = aiResponse.substring(firstBrace, lastBrace + 1);
        }

        try {
          const parsedData = JSON.parse(aiResponse);
          setAnalysisData(parsedData);
        } catch (e) {
          console.error("Erro ao ler JSON da IA:", e);
          setRawText(aiResponse); // Mostra o texto bruto se o JSON falhar
        }
      } else {
        throw new Error("A IA não retornou conteúdo.");
      }

    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Erro desconhecido";
      if (Platform.OS === 'web') alert("Erro: " + msg);
      else Alert.alert("Erro", "Falha: " + msg);
      setRawText("Não foi possível gerar a análise. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!analysisData) return;
    setSaving(true);

    try {
      // Ajuste para salvar JSON corretamente no Supabase
      const contentToSave = JSON.stringify(analysisData);

      const { error } = await supabase.from('saved_notes').insert({
        title: `Estudo: ${params.bookName} ${params.chapter}${params.verse ? ':' + params.verse : ''}`,
        reference: `${params.bookName} ${params.chapter}`, // Ajuste conforme sua tabela
        content: contentToSave, 
      });
      
      if (error) throw error;
      
      const successMsg = "Estudo salvo! Veja na aba 'Meus Estudos'.";
      if (Platform.OS === 'web') alert(successMsg);
      else Alert.alert("Sucesso", successMsg, [{ text: "OK", onPress: () => router.back() }]);
      
    } catch (e: any) {
      const errorMsg = e.message || "Erro ao salvar";
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert("Erro ao salvar", errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Componente Visual do Card
  const AnalysisCard = ({ title, content, icon, color, bgColor }: any) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.cardHeader, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} style={{ marginRight: 8 }} />
        <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardText, { fontSize: fontSize, lineHeight: fontSize * 1.5 }]}>
          {content}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={styles.headerTitle}>Análise Profunda</Text>
          <Text style={styles.headerSubtitle}>
            {params.bookName} {params.chapter} {params.verse ? `:${params.verse}` : ''}
          </Text>
        </View>

        <View style={styles.fontControls}>
          <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 2))} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFontSize(Math.min(26, fontSize + 2))} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {params.text ? (
          <View style={styles.verseBox}>
            <Ionicons name="book" size={18} color="#555" style={{marginBottom: 6}} />
            <Text style={styles.verseText}>"{params.text}"</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#AF52DE" />
            <Text style={styles.loadingText}>Consultando Teologia Profunda...</Text>
          </View>
        ) : analysisData ? (
          <View style={{ gap: 16 }}>
            <View style={styles.themeBox}>
              <Text style={styles.themeLabel}>TEMA CENTRAL</Text>
              <Text style={styles.themeText}>{analysisData.theme}</Text>
            </View>

            <AnalysisCard title="Exegese & Original" icon="search" color="#007AFF" bgColor="#E3F2FD" content={analysisData.exegesis} />
            <AnalysisCard title="Contexto Histórico" icon="time" color="#FF9500" bgColor="#FFF3E0" content={analysisData.context} />
            <AnalysisCard title="Conexões Teológicas" icon="git-merge" color="#AF52DE" bgColor="#F3E5F5" content={analysisData.theology} />
            <AnalysisCard title="Aplicação Prática" icon="heart" color="#34C759" bgColor="#E8F5E9" content={analysisData.application} />
          </View>
        ) : (
          <View style={styles.card}>
             <View style={styles.cardBody}>
               <Text style={[styles.cardText, {fontSize}]}>{rawText || "Nenhuma análise disponível. Toque em regerar."}</Text>
             </View>
          </View>
        )}
      </ScrollView>

      {!loading && (analysisData || rawText) && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={fetchAIAnalysis}>
            <Ionicons name="refresh" size={20} color="#333" />
            <Text style={styles.actionText}>Regerar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small"/> : <Ionicons name="save-outline" size={20} color="#fff" />}
            <Text style={[styles.actionText, {color: '#fff'}]}>Salvar Estudo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93' },
  fontControls: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8 },
  fontBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  fontBtnText: { fontWeight: 'bold', color: '#007AFF' },
  content: { padding: 16, paddingBottom: 100 },
  verseBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5EA', borderLeftWidth: 4, borderLeftColor: '#333' },
  verseText: { fontStyle: 'italic', color: '#333', fontSize: 16, lineHeight: 24 },
  loadingContainer: { alignItems: 'center', marginTop: 60 },
  loadingText: { marginTop: 20, fontSize: 16, fontWeight: '600', color: '#333' },
  themeBox: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  themeLabel: { color: '#8E8E93', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  themeText: { color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 26 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, borderLeftWidth: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { padding: 16 },
  cardText: { color: '#333', textAlign: 'justify' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E5EA', position: 'absolute', bottom: 0, left: 0, right: 0 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#F2F2F7', flex: 0.48, justifyContent: 'center' },
  saveButton: { backgroundColor: '#AF52DE' },
  actionText: { fontWeight: '600', color: '#333' },
});