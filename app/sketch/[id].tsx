import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Share // <--- Importante: Importamos a ferramenta de compartilhar
    ,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { supabase } from '../../lib/supabase';

// Componente do Card (FORA da função principal para não travar o teclado)
const AnalysisCard = ({ 
  title, 
  textValue, 
  onChangeText, 
  isEditing, 
  icon, 
  color, 
  bgColor, 
  fontSize 
}: any) => {
  if (!isEditing && !textValue) return null; 

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.cardHeader, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} style={{ marginRight: 8 }} />
        <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        {isEditing ? (
          <TextInput
            style={[styles.input, { fontSize: fontSize, lineHeight: fontSize * 1.5 }]}
            multiline
            value={textValue || ''}
            onChangeText={onChangeText}
            placeholder={`Digite aqui o conteúdo de ${title}...`}
          />
        ) : (
          <Text style={[styles.cardText, { fontSize: fontSize, lineHeight: fontSize * 1.5 }]}>
            {textValue}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function SketchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [sketch, setSketch] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<any>(null);
  const [fontSize, setFontSize] = useState(16);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSketch();
  }, [id]);

  async function fetchSketch() {
    try {
      const { data, error } = await supabase
        .from('sketches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setSketch(data);
      const content = typeof data.content === 'string' 
        ? { theme: "", exegesis: data.content, context: "", theology: "", application: "" } 
        : data.content;
        
      setEditedContent(content);
      
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar o estudo.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sketches')
        .update({ content: editedContent })
        .eq('id', id);

      if (error) throw error;

      setSketch({ ...sketch, content: editedContent });
      setIsEditing(false);
      Alert.alert("Sucesso", "Estudo atualizado!");

    } catch (error: any) {
      Alert.alert("Erro ao atualizar", error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- NOVA FUNÇÃO DE COMPARTILHAR ---
  const handleShare = async () => {
    if (!editedContent) return;

    try {
      // Monta um texto bonito para enviar
      const message = `
📖 *ESTUDO BÍBLICO: ${sketch.title}*
📅 ${new Date(sketch.created_at).toLocaleDateString('pt-BR')}

📌 *TEMA CENTRAL*
${editedContent.theme}

🔍 *EXEGESE & ORIGINAL*
${editedContent.exegesis}

🏛️ *CONTEXTO HISTÓRICO*
${editedContent.context}

🔗 *TEOLOGIA BÍBLICA*
${editedContent.theology}

💡 *APLICAÇÃO PRÁTICA*
${editedContent.application}

_Gerado pelo meu App Bíblia IA_
      `.trim();

      await Share.share({
        message: message,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const updateField = (field: string, text: string) => {
    setEditedContent((prev: any) => ({ ...prev, [field]: text }));
  };

  if (loading) return <ActivityIndicator size="large" color="#AF52DE" style={{marginTop: 50}} />;
  if (!sketch || !editedContent) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={{flex: 1, paddingHorizontal: 10}}>
             <Text style={styles.headerTitle} numberOfLines={1}>{sketch.title}</Text>
             <Text style={styles.date}>{new Date(sketch.created_at).toLocaleDateString('pt-BR')}</Text>
          </View>

          {/* BOTÕES DE AÇÃO: Compartilhar e Editar */}
          <View style={{flexDirection: 'row', gap: 10}}>
            
            {/* Botão Compartilhar (Só aparece se NÃO estiver editando) */}
            {!isEditing && (
              <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
                <Ionicons name="share-outline" size={22} color="#007AFF" />
              </TouchableOpacity>
            )}

            {isEditing ? (
              <TouchableOpacity onPress={handleUpdate} style={[styles.actionBtn, {backgroundColor: '#34C759'}]} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="checkmark" size={24} color="#fff" />}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionBtn}>
                <Ionicons name="pencil" size={22} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!isEditing && (
          <View style={styles.fontControlsContainer}>
            <View style={styles.fontControls}>
              <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 2))} style={styles.fontBtn}>
                <Text style={styles.fontBtnText}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFontSize(Math.min(26, fontSize + 2))} style={styles.fontBtn}>
                <Text style={styles.fontBtnText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.themeBox}>
            <Text style={styles.themeLabel}>TEMA CENTRAL</Text>
            {isEditing ? (
              <TextInput
                style={[styles.themeInput, { fontSize: 18 }]}
                multiline
                value={editedContent.theme}
                onChangeText={(text) => updateField('theme', text)}
              />
            ) : (
              <Text style={styles.themeText}>{editedContent.theme}</Text>
            )}
          </View>

          <AnalysisCard 
            title="Exegese & Original" 
            textValue={editedContent.exegesis}
            onChangeText={(t: string) => updateField('exegesis', t)}
            isEditing={isEditing} fontSize={fontSize}
            icon="search" color="#007AFF" bgColor="#E3F2FD" 
          />

          <AnalysisCard 
            title="Contexto Histórico" 
            textValue={editedContent.context}
            onChangeText={(t: string) => updateField('context', t)}
            isEditing={isEditing} fontSize={fontSize}
            icon="time" color="#FF9500" bgColor="#FFF3E0" 
          />

          <AnalysisCard 
            title="Conexões Teológicas" 
            textValue={editedContent.theology}
            onChangeText={(t: string) => updateField('theology', t)}
            isEditing={isEditing} fontSize={fontSize}
            icon="git-merge" color="#AF52DE" bgColor="#F3E5F5" 
          />

          <AnalysisCard 
            title="Aplicação Prática" 
            textValue={editedContent.application}
            onChangeText={(t: string) => updateField('application', t)}
            isEditing={isEditing} fontSize={fontSize}
            icon="heart" color="#34C759" bgColor="#E8F5E9" 
          />

          {isEditing && <View style={{height: 300}} />}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  date: { fontSize: 12, color: '#8E8E93' },
  
  // Botão Unificado (Serve pra editar e compartilhar)
  actionBtn: { padding: 8, backgroundColor: '#E3F2FD', borderRadius: 8, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  
  fontControlsContainer: { alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 10 },
  fontControls: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 2 },
  fontBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  fontBtnText: { fontWeight: 'bold', color: '#007AFF' },
  content: { padding: 16, paddingBottom: 40 },
  themeBox: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 12, marginBottom: 8 },
  themeLabel: { color: '#8E8E93', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  themeText: { color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 26 },
  themeInput: { color: '#fff', fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#666', paddingBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderLeftWidth: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { padding: 16 },
  cardText: { color: '#333', textAlign: 'justify' },
  input: { color: '#333', textAlignVertical: 'top', minHeight: 100, borderBottomWidth: 1, borderBottomColor: '#eee' },
});