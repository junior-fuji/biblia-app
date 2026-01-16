import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert,
  Keyboard,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

// ============================================================================
// ⚠️ SUA CHAVE AQUI ⚠️
// ============================================================================
const OPENAI_API_KEY = ''; // <--- COLE SUA CHAVE AQUI

type DictionaryData = {
    theme: string;
    exegesis: string;
    history: string;
    theology: string;
    application: string;
};

export default function DictionaryScreen() {
  const insets = useSafeAreaInsets();
  const [word, setWord] = useState('');
  const [result, setResult] = useState<DictionaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!word.trim()) {
      Alert.alert("Atenção", "Digite uma palavra para pesquisar.");
      return;
    }

    setLoading(true);
    setResult(null);
    Keyboard.dismiss();

    const SYSTEM_PROMPT = `
    VOICE: Você é um Dicionário Bíblico e Filólogo Especialista em Hebraico, Aramaico e Grego.
    TASK: Analise a palavra fornecida e retorne um JSON.
    IMPORTANT: Todos os campos do JSON devem ser TEXTO CORRIDO (String). Não use objetos aninhados.
    
    ESTRUTURA JSON OBRIGATÓRIA:
    {
      "theme": "Definição direta e resumo.",
      "exegesis": "Texto único contendo a palavra em Hebraico e Grego (transliterados) e explicação.",
      "history": "Etimologia e contexto cultural.",
      "theology": "Significado teológico.",
      "application": "Referências bíblicas e aplicação."
    }
    `;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Analise a palavra bíblica: "${word}"` }
          ],
          temperature: 0.5
        })
      });

      const data = await res.json();
      if (data.choices) {
        let content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        setResult(JSON.parse(content));
      } else {
        Alert.alert("Erro", "A IA não retornou nada.");
      }
    } catch (error: any) {
        // Se der erro na Web usa o alert simples
        if (Platform.OS === 'web') alert("Verifique sua API Key ou conexão.");
        else Alert.alert("Erro", "Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);

    const { error } = await supabase.from('saved_notes').insert({
      title: `Dicionário: ${word}`,
      reference: "Termo Bíblico",
      content: JSON.stringify(result)
    });

    setSaving(false);

    if (error) {
        if (Platform.OS === 'web') alert("Erro ao salvar.");
        else Alert.alert("Erro", "Não foi possível salvar.");
    } else {
        if (Platform.OS === 'web') alert("Salvo em Meus Estudos!");
        else Alert.alert("Sucesso!", "Definição salva em 'Meus Estudos'.");
    }
  };

  // --- CORREÇÃO DO ERRO "OBJECTS ARE NOT VALID" ---
  const InfoCard = ({ title, text, color, icon }: any) => {
      // Se não tiver texto, não mostra nada
      if (!text) return null;

      let safeContent = text;

      // SE O TEXTO FOR UM OBJETO (CAUSA DO ERRO), CONVERTE PARA STRING
      if (typeof text === 'object') {
          try {
              // Tenta pegar os valores do objeto e juntar com quebra de linha
              safeContent = Object.values(text).join('\n\n');
          } catch (e) {
              // Se falhar, transforma em string crua
              safeContent = JSON.stringify(text);
          }
      }

      return (
        <View style={styles.boxContainer}>
            <View style={[styles.boxBar, { backgroundColor: color }]} />
            <View style={styles.boxContent}>
            <View style={styles.boxHeader}>
                <Ionicons name={icon} size={18} color={color} style={{ marginRight: 8 }} />
                <Text style={[styles.boxTitle, { color: color }]}>{title}</Text>
            </View>
            <Text style={styles.boxBody}>{safeContent}</Text>
            </View>
        </View>
      );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 20 }]}>
        <Text style={styles.headerTitle}>Dicionário Original</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* ÁREA DE BUSCA */}
          <View style={styles.searchCard}>
            <Text style={styles.label}>Qual palavra você quer investigar?</Text>
            <View style={styles.inputRow}>
                <TextInput
                style={styles.input}
                placeholder="Ex: Graça, Fé, Arrependimento..."
                placeholderTextColor="#C7C7CC"
                value={word}
                onChangeText={setWord}
                onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={24} color="#fff" />}
                </TouchableOpacity>
            </View>
          </View>

          {/* RESULTADOS */}
          {result && (
              <View style={{ marginTop: 20 }}>
                  <View style={styles.resultHeader}>
                      <Text style={styles.resultTitle}>{word.toUpperCase()}</Text>
                      <TouchableOpacity onPress={handleSave} disabled={saving}>
                         {saving ? <ActivityIndicator color="#007AFF" /> : <Ionicons name="bookmark-outline" size={28} color="#007AFF" />}
                      </TouchableOpacity>
                  </View>
                  <Text style={styles.resultSubtitle}>Toque no ícone acima para salvar nos seus estudos.</Text>

                  <InfoCard title="DEFINIÇÃO" icon="information-circle" color="#1C1C1E" text={result.theme} />
                  <InfoCard title="NO ORIGINAL (HEBRAICO/GREGO)" icon="language" color="#007AFF" text={result.exegesis} />
                  <InfoCard title="ORIGEM & ETIMOLOGIA" icon="git-branch" color="#FF9500" text={result.history} />
                  <InfoCard title="SIGNIFICADO TEOLÓGICO" icon="book" color="#AF52DE" text={result.theology} />
                  <InfoCard title="ONDE APARECE (VERSÍCULOS)" icon="list" color="#34C759" text={result.application} />
              </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  searchCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 10, padding: 15, fontSize: 16, color: '#000', marginRight: 10 },
  searchButton: { backgroundColor: '#007AFF', borderRadius: 10, width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },

  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  resultTitle: { fontSize: 24, fontWeight: '900', color: '#000', letterSpacing: 1 },
  resultSubtitle: { fontSize: 12, color: '#8E8E93', marginBottom: 20 },

  boxContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  boxBar: { width: 5 }, 
  boxContent: { flex: 1, padding: 15 },
  boxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  boxTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  boxBody: { fontSize: 16, lineHeight: 24, color: '#333' }
});