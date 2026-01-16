import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    SafeAreaView,
    SectionList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- DADOS DO PLANO (Exemplo: ERA 1 e 2 Completas) ---
// Para ter a Bíblia toda, precisaríamos de 365 itens aqui.
// Esta estrutura permite adicionar tudo sem quebrar o app.
const READING_PLAN = [
  {
    title: "1. A Criação e o Início (Gênesis)",
    data: [
      { day: 1, ref: "Gênesis 1-3", id: "d1" },
      { day: 2, ref: "Gênesis 4-7", id: "d2" },
      { day: 3, ref: "Gênesis 8-11", id: "d3" },
      { day: 4, ref: "Jó 1-5", id: "d4" }, // Cronológico: Jó viveu na época dos patriarcas
      { day: 5, ref: "Jó 6-9", id: "d5" },
      { day: 6, ref: "Jó 10-13", id: "d6" },
      { day: 7, ref: "Jó 14-16", id: "d7" },
    ]
  },
  {
    title: "2. Os Patriarcas (Abraão, Isaque, Jacó)",
    data: [
      { day: 8, ref: "Gênesis 12-15", id: "d8" },
      { day: 9, ref: "Gênesis 16-18", id: "d9" },
      { day: 10, ref: "Gênesis 19-21", id: "d10" },
      { day: 11, ref: "Gênesis 22-24", id: "d11" },
      { day: 12, ref: "Gênesis 25-26", id: "d12" },
      { day: 13, ref: "Gênesis 27-29", id: "d13" },
      { day: 14, ref: "Gênesis 30-31", id: "d14" },
    ]
  },
  {
    title: "3. O Êxodo e a Lei",
    data: [
       { day: 15, ref: "Êxodo 1-3", id: "d15" },
       { day: 16, ref: "Êxodo 4-6", id: "d16" },
       // ... aqui você adicionaria o resto ...
    ]
  }
];

export default function ReadingPlanScreen() {
  const router = useRouter();
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // Carrega o progresso salvo ao abrir
  useEffect(() => {
    loadProgress();
  }, []);

  // Calcula a % sempre que marcar/desmarcar
  useEffect(() => {
    const totalDays = READING_PLAN.reduce((acc, section) => acc + section.data.length, 0);
    const completedCount = completedDays.length;
    setProgress(completedCount / totalDays);
  }, [completedDays]);

  const loadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem('@bible_progress');
      if (saved) setCompletedDays(JSON.parse(saved));
    } catch (e) {
      console.log("Erro ao carregar");
    }
  };

  const toggleDay = async (id: string) => {
    let newCompleted;
    if (completedDays.includes(id)) {
      newCompleted = completedDays.filter(d => d !== id); // Remove
    } else {
      newCompleted = [...completedDays, id]; // Adiciona
    }
    
    setCompletedDays(newCompleted);
    await AsyncStorage.setItem('@bible_progress', JSON.stringify(newCompleted));
  };

  const renderItem = ({ item }: { item: any }) => {
    const isDone = completedDays.includes(item.id);

    return (
      <TouchableOpacity 
        style={[styles.dayCard, isDone && styles.dayCardDone]} 
        onPress={() => toggleDay(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.dayInfo}>
          <Text style={[styles.dayNumber, isDone && styles.textDone]}>Dia {item.day}</Text>
          <Text style={[styles.dayRef, isDone && styles.textDone]}>{item.ref}</Text>
        </View>
        
        <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
          {isDone && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Plano Anual</Text>
        <View style={{width: 24}} /> 
      </View>

      {/* BARRA DE PROGRESSO */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}% Concluído</Text>
      </View>

      {/* LISTA DE LEITURA */}
      <SectionList
        sections={READING_PLAN}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff'
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  progressContainer: {
    padding: 20, backgroundColor: '#fff', marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#E5E5EA'
  },
  progressBarBg: {
    height: 12, backgroundColor: '#E5E5EA', borderRadius: 6, overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%', backgroundColor: '#34C759', borderRadius: 6
  },
  progressText: {
    marginTop: 8, textAlign: 'center', color: '#666', fontSize: 12, fontWeight: '600'
  },

  listContent: { padding: 16, paddingBottom: 40 },
  
  sectionHeader: {
    marginTop: 16, marginBottom: 8, paddingVertical: 4,
    backgroundColor: '#F2F2F7' // Fundo transparente para separar visualmente
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1
  },

  dayCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  dayCardDone: {
    backgroundColor: '#F0FFF4', // Verde bem clarinho quando feito
  },
  dayInfo: { flex: 1 },
  dayNumber: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', marginBottom: 2 },
  dayRef: { fontSize: 16, fontWeight: '600', color: '#333' },
  textDone: { color: '#34C759', textDecorationLine: 'line-through' },

  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#C7C7CC',
    alignItems: 'center', justifyContent: 'center'
  },
  checkboxDone: {
    backgroundColor: '#34C759', borderColor: '#34C759'
  }
});