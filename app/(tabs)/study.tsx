import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform, ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

// --- COMPONENTE VISUAL DAS CAIXAS (O MESMO DA IA) ---
const InfoCard = ({ title, text, color, icon }: any) => {
    if (!text) return null;
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.cardBar, { backgroundColor: color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Ionicons name={icon} size={20} color={color} style={{marginRight: 8}} />
            <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
          </View>
          <Text style={styles.cardBody}>{text}</Text>
        </View>
      </View>
    );
};

export default function MyStudiesScreen() {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Visualização/Edição
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Campos de Edição
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState(''); // Texto puro ou JSON string
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStudies();
    }, [])
  );

  const fetchStudies = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('saved_notes').select('*').order('created_at', { ascending: false });
    if (!error) setStudies(data || []);
    setLoading(false);
  };

  const openStudy = (item: any) => {
    setSelectedStudy(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Excluir", "Apagar este estudo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: async () => {
          await supabase.from('saved_notes').delete().eq('id', id);
          setModalVisible(false);
          fetchStudies();
      }}
    ]);
  };

  const handleShare = async () => {
    if (!selectedStudy) return;
    try {
        // Tenta formatar bonito se for JSON
        let message = `*${selectedStudy.title.toUpperCase()}*\n\n`;
        try {
            const json = JSON.parse(selectedStudy.content);
            if (json.era) { // Veio do Diário
                message += `🏛️ ERA: ${json.era}\n`;
                if(json.characters) message += `👤 PERSONAGENS: ${json.characters}\n`;
                if(json.location) message += `📍 LOCAL: ${json.location}\n`;
                if(json.context) message += `📖 CONTEXTO: ${json.context}\n`;
                if(json.reflection) message += `\n💡 REFLEXÃO:\n${json.reflection}`;
            } else if (json.theme) { // Veio da IA
                message += `📖 TEMA: ${json.theme}\n`;
                if(json.history) message += `🏛️ HISTÓRICO: ${json.history}\n`;
                if(json.theology) message += `✝️ TEOLOGIA: ${json.theology}\n`;
                if(json.application) message += `🌱 APLICAÇÃO: ${json.application}\n`;
            } else {
                message += selectedStudy.content;
            }
        } catch (e) {
            message += selectedStudy.content;
        }
        await Share.share({ message });
    } catch (error) {}
  };

  const handleSaveEdit = async () => {
    if (!selectedStudy) return;
    setSaving(true);
    
    // Se o conteúdo original era JSON, tentamos manter a estrutura
    let finalContent = editContent;
    try {
        const originalJson = JSON.parse(selectedStudy.content);
        // Se o usuário editou apenas a "reflexão" num modo simplificado, 
        // aqui você poderia ter lógica complexa. 
        // Por simplificação, o modo edição salva como Texto Puro ou JSON editado manualmente.
        // Se quiser manter o JSON, o usuário teria que editar o JSON bruto no TextInput.
    } catch(e) {}

    const { error } = await supabase.from('saved_notes').update({
        title: editTitle,
        content: finalContent
    }).eq('id', selectedStudy.id);

    setSaving(false);
    if (!error) {
        // Atualiza o objeto local para refletir a mudança sem fechar
        setSelectedStudy({ ...selectedStudy, title: editTitle, content: finalContent });
        setIsEditing(false);
        fetchStudies(); // Atualiza a lista de fundo
        Alert.alert("Sucesso", "Alterações salvas!");
    } else {
        Alert.alert("Erro", "Falha ao salvar.");
    }
  };

  // Renderiza o conteúdo dentro do Modal usando as CAIXAS COLORIDAS
  const renderStudyContent = (contentString: string) => {
    try {
        const data = JSON.parse(contentString);

        // CASO 1: VEIO DA IA (theme, history, exegesis...)
        if (data.theme || data.theology) {
            return (
                <>
                    <InfoCard title="TEMA CENTRAL" icon="bookmark" color="#1C1C1E" text={data.theme} />
                    <InfoCard title="CONTEXTO HISTÓRICO" icon="time" color="#FF9500" text={data.history} />
                    <InfoCard title="EXEGESE & LINGUÍSTICA" icon="search" color="#007AFF" text={data.exegesis} />
                    <InfoCard title="TEOLOGIA SISTEMÁTICA" icon="book" color="#AF52DE" text={data.theology} />
                    <InfoCard title="APLICAÇÃO PRÁTICA" icon="leaf" color="#34C759" text={data.application} />
                </>
            );
        }

        // CASO 2: VEIO DO DIÁRIO (era, characters, location...)
        if (data.era) {
            return (
                <>
                    <InfoCard title="ERA HISTÓRICA" icon="flag" color="#1C1C1E" text={data.era} />
                    
                    {/* Agrupando detalhes em uma caixa azul */}
                    <InfoCard 
                        title="DETALHES DO CENÁRIO" 
                        icon="map" 
                        color="#007AFF" 
                        text={`👤 Personagens: ${data.characters}\n📍 Local: ${data.location}`} 
                    />
                    
                    <InfoCard title="CONTEXTO HISTÓRICO" icon="time" color="#FF9500" text={data.context} />
                    <InfoCard title="MINHA REFLEXÃO & APLICAÇÃO" icon="create" color="#AF52DE" text={data.reflection} />
                </>
            );
        }

        // CASO 3: JSON DESCONHECIDO
        return <Text style={styles.bodyText}>{JSON.stringify(data, null, 2)}</Text>;

    } catch (e) {
        // CASO 4: TEXTO PURO (NÃO É JSON)
        return (
            <InfoCard title="ANOTAÇÃO LIVRE" icon="document-text" color="#333" text={contentString} />
        );
    }
  };

  const renderListItem = ({ item }: any) => {
    const date = new Date(item.created_at).toLocaleDateString('pt-BR');
    return (
      <TouchableOpacity style={styles.card} onPress={() => openStudy(item)}>
        <View style={styles.cardIcon}>
            <Ionicons name="document-text" size={24} color="#007AFF" />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.listTitle} numberOfLines={1}>{item.title || "Sem Título"}</Text>
            <Text style={styles.listDate}>{date} • {item.reference}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Estudos</Text>
        <Text style={styles.headerSubtitle}>Sermões e anotações salvas</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 50}} />
      ) : (
        <FlatList 
            data={studies}
            keyExtractor={item => item.id.toString()}
            renderItem={renderListItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="library-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Nenhum estudo salvo ainda.</Text>
                </View>
            }
        />
      )}

      {/* MODAL DE VISUALIZAÇÃO / EDIÇÃO */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
            
            {/* CABEÇALHO DO MODAL */}
            <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle} numberOfLines={1}>
                    {isEditing ? "Editando" : (selectedStudy?.title || "Detalhes")}
                </Text>
                {isEditing ? (
                    <TouchableOpacity onPress={handleSaveEdit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#007AFF"/> : <Text style={styles.saveText}>Salvar</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* BARRA DE AÇÕES (Só aparece se não estiver editando) */}
            {!isEditing && (
                <View style={styles.actionBar}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color="#007AFF" />
                        <Text style={styles.actionLabel}>Compartilhar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(selectedStudy?.id)}>
                        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                        <Text style={[styles.actionLabel, {color: '#FF3B30'}]}>Excluir</Text>
                    </TouchableOpacity>
                </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
                <ScrollView style={styles.modalBody}>
                    {isEditing ? (
                        // MODO EDIÇÃO (Texto Puro para facilitar)
                        <>
                            <Text style={styles.label}>Título:</Text>
                            <TextInput 
                                style={styles.inputTitle} 
                                value={editTitle} 
                                onChangeText={setEditTitle} 
                            />
                            <Text style={styles.label}>Conteúdo (JSON ou Texto):</Text>
                            <TextInput 
                                style={styles.inputContent} 
                                value={editContent} 
                                onChangeText={setEditContent} 
                                multiline 
                                textAlignVertical="top" 
                            />
                            <Text style={styles.hint}>* Cuidado ao editar a estrutura JSON se quiser manter as caixas coloridas.</Text>
                        </>
                    ) : (
                        // MODO VISUALIZAÇÃO (CAIXAS COLORIDAS)
                        <>
                            <Text style={styles.studyBigTitle}>{selectedStudy?.title}</Text>
                            {selectedStudy && renderStudyContent(selectedStudy.content)}
                        </>
                    )}
                    <View style={{height: 50}} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#000' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 5 },
  listContent: { padding: 20 },

  // LISTA SIMPLES
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  listDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },

  // MODAL
  modalContainer: { flex: 1, backgroundColor: '#F9F9F9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  closeText: { fontSize: 17, color: '#007AFF' },
  editText: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  saveText: { fontSize: 17, color: '#007AFF', fontWeight: 'bold' },

  actionBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#fff', marginBottom: 10 },
  actionBtn: { alignItems: 'center' },
  actionLabel: { fontSize: 10, marginTop: 4, color: '#007AFF' },

  modalBody: { padding: 20 },
  studyBigTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  bodyText: { fontSize: 16, color: '#333', lineHeight: 24 },

  // CAIXAS COLORIDAS (INFOCARD)
  cardContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardBar: { width: 5 }, 
  cardContent: { flex: 1, padding: 15, paddingVertical: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { fontSize: 16, lineHeight: 24, color: '#333', textAlign: 'justify' },

  // EDITOR
  label: { fontSize: 14, fontWeight: '700', color: '#8E8E93', marginBottom: 5, marginTop: 15 },
  inputTitle: { fontSize: 18, fontWeight: 'bold', backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  inputContent: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', backgroundColor: '#fff', padding: 10, borderRadius: 8, minHeight: 300, lineHeight: 20 },
  hint: { fontSize: 12, color: '#FF9500', marginTop: 10, fontStyle: 'italic' }
});