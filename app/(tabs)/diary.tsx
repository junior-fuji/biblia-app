import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// --- LISTA DE ERAS ---
const ERAS = [
  '1. Criação e Queda',
  '2. Era Patriarcal (Jó)', 
  '3. Os Patriarcas',
  '4. O Êxodo',
  '5. A Lei e o Tabernáculo',
  '6. A Peregrinação',
  '7. Últimas Palavras de Moisés',
  '8. A Conquista',
  '9. Os Juízes',
  '10. Samuel, Saul e Davi',
  '11. O Reinado de Davi',
  '12. Salmos (Davi e Outros)', 
  '13. Salomão',
  '14. Sabedoria de Salomão',
  '15. Reino Dividido',
  '16. Profetas Menores',
  '17. Profetas Maiores (Isaías)',
  '18. O Profeta da Queda',
  '19. O Exílio Babilônico',
  '20. O Retorno',
  '21. A Vida de Jesus',
  '22. Igreja Primitiva',
  '23. Cartas Gerais',
  '24. Viagens de Paulo',
  '25. Cartas de Paulo',
  '26. Fim e Eternidade'
];

export default function AtlasScreen() {
  const insets = useSafeAreaInsets();
  
  // ESTADOS DO FORMULÁRIO
  const [selectedEra, setSelectedEra] = useState('');
  const [characters, setCharacters] = useState('');
  const [location, setLocation] = useState('');
  const [context, setContext] = useState('');
  const [reflection, setReflection] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [showEraModal, setShowEraModal] = useState(false);

  const handleSave = async () => {
    if (!selectedEra || !reflection.trim()) {
      Alert.alert("Atenção", "Selecione a Era e escreva uma reflexão.");
      return;
    }
    setSaving(true);
    Keyboard.dismiss();

    // Empacota os dados para salvar no JSON
    const studyContent = {
        type: 'personal_study', 
        theme: `Era: ${selectedEra}`, // Aparecerá como TEMA no visualizador
        era: selectedEra,
        history: context, // Aparecerá como HISTÓRICO
        exegesis: `Personagens: ${characters}\nLocal: ${location}`, // Aparecerá como EXEGESE
        application: reflection, // Aparecerá como APLICAÇÃO
        characters: characters,
        location: location
    };

    try {
          const sb = getSupabaseOrThrow();
          const { data, error } = await sb.from('saved_notes').insert({
              title: `Diário: ${selectedEra}`,
            reference: "Atlas Histórico",
            content: JSON.stringify(studyContent)
        });

        if (error) throw error;

        Alert.alert("Sucesso!", "Estudo salvo em 'Meus Estudos'!");
        
        // Limpar campos
        setCharacters('');
        setLocation('');
        setContext('');
        setReflection('');
        
    } catch (error) {
        Alert.alert("Erro", "Não foi possível salvar. Verifique sua conexão.");
        console.log(error);
    } finally {
        setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 20 }]}>
        <Text style={styles.headerTitle}>Diário das Eras</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.sectionTitle}>1. IDENTIFICAÇÃO</Text>
          
          <Text style={styles.label}>Era Histórica</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowEraModal(true)}>
            <Text style={selectedEra ? styles.selectorText : styles.placeholderText}>
                {selectedEra || "Selecione a Era..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <Text style={styles.label}>Personagens Centrais</Text>
          <TextInput style={styles.input} placeholder="Ex: Moisés, Arão..." value={characters} onChangeText={setCharacters} />

          <Text style={styles.label}>Local Geográfico</Text>
          <TextInput style={styles.input} placeholder="Ex: Deserto do Sinai..." value={location} onChangeText={setLocation} />

          <Text style={styles.sectionTitle}>2. ANÁLISE</Text>

          <Text style={styles.label}>Contexto Histórico/Cultural</Text>
          <TextInput 
            style={[styles.input, { height: 80 }]} 
            placeholder="O que estava acontecendo na época?" 
            value={context} onChangeText={setContext} multiline 
          />

          <Text style={styles.label}>Minhas Observações & Aplicação</Text>
          <TextInput
            style={[styles.inputArea, { minHeight: 150 }]}
            placeholder="Escreva aqui suas conclusões e o que compartilhar..."
            value={reflection}
            onChangeText={setReflection}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Estudo</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL PARA ESCOLHER A ERA */}
      <Modal visible={showEraModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Escolha a Era</Text>
                    <TouchableOpacity onPress={() => setShowEraModal(false)}><Ionicons name="close" size={24} color="#000"/></TouchableOpacity>
                </View>
                <FlatList 
                    data={ERAS}
                    keyExtractor={item => item}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.eraItem} onPress={() => { setSelectedEra(item); setShowEraModal(false); }}>
                            <Text style={styles.eraItemText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#8E8E93', marginTop: 10, marginBottom: 10, textTransform: 'uppercase' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  selector: { backgroundColor: '#fff', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth:1, borderColor:'#E5E5EA', marginBottom: 15 },
  selectorText: { fontSize: 16, color: '#000' },
  placeholderText: { fontSize: 16, color: '#C7C7CC' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 16, color: '#000', borderWidth:1, borderColor:'#E5E5EA', marginBottom: 15 },
  inputArea: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 16, color: '#000', borderWidth:1, borderColor:'#E5E5EA', marginBottom: 15 },
  saveButton: { backgroundColor: '#AF52DE', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalContent: { backgroundColor:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'70%' },
  modalHeader: { padding: 20, borderBottomWidth:1, borderColor:'#eee', flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  modalTitle: { fontSize: 18, fontWeight:'bold' },
  eraItem: { padding: 20, borderBottomWidth:1, borderColor:'#f0f0f0' },
  eraItemText: { fontSize: 16 }
});