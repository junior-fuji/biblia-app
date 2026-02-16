import { fetchAIAnalysis } from '@/lib/openai';
import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function AIAnalysisModal({ visible, onClose, text, context }: any) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (visible && text) {
            analyze();
        }
    }, [visible, text]);

    const analyze = async () => {
        setLoading(true);
        const result = await fetchAIAnalysis(text, 'CHAPTER'); // Usa o prompt de teólogo
        setData(result);
        setLoading(false);
    };
    const supabase = getSupabaseOrThrow();

    const handleSave = async () => {
        if (!data) return;
        const { error } = await supabase.from('saved_notes').insert({
            title: `Análise: ${context}`,
            reference: context,
            content: JSON.stringify(data)
        });
        if (!error) Alert.alert("Salvo", "Estudo salvo com sucesso!");
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Dr. Logos (IA)</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#AF52DE" /><Text>Consultando as escrituras...</Text></View>
                ) : data ? (
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.card}><Text style={styles.label}>TEMA</Text><Text style={styles.body}>{data.theme}</Text></View>
                        <View style={[styles.card, { borderLeftColor: '#007AFF' }]}><Text style={styles.label}>EXEGESE</Text><Text style={styles.body}>{data.exegesis}</Text></View>
                        <View style={[styles.card, { borderLeftColor: '#FF9500' }]}><Text style={styles.label}>CONTEXTO</Text><Text style={styles.body}>{data.context || data.history}</Text></View>
                        <View style={[styles.card, { borderLeftColor: '#AF52DE' }]}><Text style={styles.label}>TEOLOGIA</Text><Text style={styles.body}>{data.theology}</Text></View>
                        <View style={[styles.card, { borderLeftColor: '#34C759' }]}><Text style={styles.label}>APLICAÇÃO</Text><Text style={styles.body}>{data.application}</Text></View>
                        
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Ionicons name="save" size={20} color="#fff" />
                            <Text style={{color:'#fff', fontWeight:'bold'}}>Salvar Estudo</Text>
                        </TouchableOpacity>
                        <View style={{height: 50}}/>
                    </ScrollView>
                ) : (
                    <View style={styles.center}><Text>Não foi possível analisar.</Text></View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: '800', color: '#AF52DE' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    content: { padding: 20 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#333' },
    label: { fontSize: 10, fontWeight: '900', color: '#999', marginBottom: 5 },
    body: { fontSize: 16, lineHeight: 24, color: '#333' },
    saveBtn: { backgroundColor: '#AF52DE', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 10, alignItems: 'center' }
});