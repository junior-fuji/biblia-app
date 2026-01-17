import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    ScrollView, StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Ativa animação no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- DADOS DOS LIVROS ---
const BOOKS_INFO: {[key: string]: { name: string, caps: number }} = {
  'GN': { name: 'Gênesis', caps: 50 }, 'EX': { name: 'Êxodo', caps: 40 }, 'LV': { name: 'Levítico', caps: 27 },
  'NM': { name: 'Números', caps: 36 }, 'DT': { name: 'Deuteronômio', caps: 34 }, 'JS': { name: 'Josué', caps: 24 },
  'JZ': { name: 'Juízes', caps: 21 }, 'RT': { name: 'Rute', caps: 4 }, '1SM': { name: '1 Samuel', caps: 31 },
  '2SM': { name: '2 Samuel', caps: 24 }, '1RS': { name: '1 Reis', caps: 22 }, '2RS': { name: '2 Reis', caps: 25 },
  '1CR': { name: '1 Crônicas', caps: 29 }, '2CR': { name: '2 Crônicas', caps: 36 }, 'ED': { name: 'Esdras', caps: 10 },
  'NE': { name: 'Neemias', caps: 13 }, 'ET': { name: 'Ester', caps: 10 }, 'JO': { name: 'Jó', caps: 42 },
  'SL': { name: 'Salmos', caps: 150 }, 'PV': { name: 'Provérbios', caps: 31 }, 'EC': { name: 'Eclesiastes', caps: 12 },
  'CT': { name: 'Cânticos', caps: 8 }, 'IS': { name: 'Isaías', caps: 66 }, 'JR': { name: 'Jeremias', caps: 52 },
  'LM': { name: 'Lamentações', caps: 5 }, 'EZ': { name: 'Ezequiel', caps: 48 }, 'DN': { name: 'Daniel', caps: 12 },
  'OS': { name: 'Oseias', caps: 14 }, 'JL': { name: 'Joel', caps: 3 }, 'AM': { name: 'Amós', caps: 9 },
  'OB': { name: 'Obadias', caps: 1 }, 'JN': { name: 'Jonas', caps: 4 }, 'MQ': { name: 'Miqueias', caps: 7 },
  'NA': { name: 'Naum', caps: 3 }, 'HC': { name: 'Habacuque', caps: 3 }, 'SF': { name: 'Sofonias', caps: 3 },
  'AG': { name: 'Ageu', caps: 2 }, 'ZC': { name: 'Zacarias', caps: 14 }, 'ML': { name: 'Malaquias', caps: 4 },
  'MT': { name: 'Mateus', caps: 28 }, 'MC': { name: 'Marcos', caps: 16 }, 'LC': { name: 'Lucas', caps: 24 },
  'JOAO': { name: 'João', caps: 21 }, 'AT': { name: 'Atos', caps: 28 }, 'RM': { name: 'Romanos', caps: 16 },
  '1CO': { name: '1 Coríntios', caps: 16 }, '2CO': { name: '2 Coríntios', caps: 13 }, 'GL': { name: 'Gálatas', caps: 6 },
  'EF': { name: 'Efésios', caps: 6 }, 'FP': { name: 'Filipenses', caps: 4 }, 'CL': { name: 'Colossenses', caps: 4 },
  '1TS': { name: '1 Tessalonicenses', caps: 5 }, '2TS': { name: '2 Tessalonicenses', caps: 3 }, '1TM': { name: '1 Timóteo', caps: 6 },
  '2TM': { name: '2 Timóteo', caps: 4 }, 'TT': { name: 'Tito', caps: 3 }, 'FM': { name: 'Filemom', caps: 1 },
  'HB': { name: 'Hebreus', caps: 13 }, 'TG': { name: 'Tiago', caps: 5 }, '1PE': { name: '1 Pedro', caps: 5 },
  '2PE': { name: '2 Pedro', caps: 3 }, '1JO': { name: '1 João', caps: 5 }, '2JO': { name: '2 João', caps: 1 },
  '3JO': { name: '3 João', caps: 1 }, 'JD': { name: 'Judas', caps: 1 }, 'AP': { name: 'Apocalipse', caps: 22 }
};

// --- ORDEM CRONOLÓGICA ---
const CHRONO_READING_BLOCKS = [
  { book: 'GN', start: 1, end: 11, era: '1. Criação e Queda' },
  { book: 'JO', start: 1, end: 42, era: '2. Era Patriarcal (Jó)' }, 
  { book: 'GN', start: 12, end: 50, era: '3. Os Patriarcas' },
  { book: 'EX', start: 1, end: 40, era: '4. O Êxodo' },
  { book: 'LV', start: 1, end: 27, era: '5. A Lei e o Tabernáculo' },
  { book: 'NM', start: 1, end: 36, era: '6. A Peregrinação' },
  { book: 'SL', start: 90, end: 90, era: '6. A Peregrinação' }, // Salmo de Moisés
  { book: 'DT', start: 1, end: 34, era: '7. Últimas Palavras de Moisés' },
  { book: 'JS', start: 1, end: 24, era: '8. A Conquista' },
  { book: 'JZ', start: 1, end: 21, era: '9. Os Juízes' },
  { book: 'RT', start: 1, end: 4, era: '9. Os Juízes' },
  { book: '1SM', start: 1, end: 31, era: '10. Samuel, Saul e Davi' },
  { book: '2SM', start: 1, end: 24, era: '11. O Reinado de Davi' },
  { book: '1CR', start: 1, end: 29, era: '11. O Reinado de Davi' },
  { book: 'SL', start: 1, end: 89, era: '12. Salmos (Davi)' }, 
  { book: 'SL', start: 91, end: 150, era: '12. Salmos (Outros)' },
  { book: '1RS', start: 1, end: 11, era: '13. Salomão' },
  { book: '2CR', start: 1, end: 9, era: '13. Salomão' },
  { book: 'PV', start: 1, end: 31, era: '14. Sabedoria de Salomão' },
  { book: 'EC', start: 1, end: 12, era: '14. Sabedoria de Salomão' },
  { book: 'CT', start: 1, end: 8, era: '14. Sabedoria de Salomão' },
  { book: '1RS', start: 12, end: 22, era: '15. Reino Dividido' },
  { book: '2RS', start: 1, end: 25, era: '15. Reino Dividido' },
  { book: '2CR', start: 10, end: 36, era: '15. Reino Dividido' },
  { book: 'OB', start: 1, end: 1, era: '16. Profetas Menores' },
  { book: 'JL', start: 1, end: 3, era: '16. Profetas Menores' },
  { book: 'JN', start: 1, end: 4, era: '16. Profetas Menores' },
  { book: 'AM', start: 1, end: 9, era: '16. Profetas Menores' },
  { book: 'OS', start: 1, end: 14, era: '16. Profetas Menores' },
  { book: 'IS', start: 1, end: 66, era: '17. Profetas Maiores (Isaías)' },
  { book: 'MQ', start: 1, end: 7, era: '16. Profetas Menores' },
  { book: 'NA', start: 1, end: 3, era: '16. Profetas Menores' },
  { book: 'SF', start: 1, end: 3, era: '16. Profetas Menores' },
  { book: 'JR', start: 1, end: 52, era: '18. O Profeta da Queda' },
  { book: 'LM', start: 1, end: 5, era: '18. O Profeta da Queda' },
  { book: 'HC', start: 1, end: 3, era: '16. Profetas Menores' },
  { book: 'DN', start: 1, end: 12, era: '19. O Exílio Babilônico' },
  { book: 'EZ', start: 1, end: 48, era: '19. O Exílio Babilônico' },
  { book: 'ED', start: 1, end: 10, era: '20. O Retorno' },
  { book: 'AG', start: 1, end: 2, era: '20. O Retorno' },
  { book: 'ZC', start: 1, end: 14, era: '20. O Retorno' },
  { book: 'ET', start: 1, end: 10, era: '20. O Retorno' },
  { book: 'NE', start: 1, end: 13, era: '20. O Retorno' },
  { book: 'ML', start: 1, end: 4, era: '20. O Retorno' },
  { book: 'LC', start: 1, end: 24, era: '21. A Vida de Jesus' },
  { book: 'JOAO', start: 1, end: 21, era: '21. A Vida de Jesus' },
  { book: 'MT', start: 1, end: 28, era: '21. A Vida de Jesus' },
  { book: 'MC', start: 1, end: 16, era: '21. A Vida de Jesus' },
  { book: 'AT', start: 1, end: 12, era: '22. Igreja Primitiva' },
  { book: 'TG', start: 1, end: 5, era: '23. Cartas Gerais' },
  { book: 'AT', start: 13, end: 28, era: '24. Viagens de Paulo' },
  { book: 'GL', start: 1, end: 6, era: '25. Cartas de Paulo' },
  { book: '1TS', start: 1, end: 5, era: '25. Cartas de Paulo' },
  { book: '2TS', start: 1, end: 3, era: '25. Cartas de Paulo' },
  { book: '1CO', start: 1, end: 16, era: '25. Cartas de Paulo' },
  { book: '2CO', start: 1, end: 13, era: '25. Cartas de Paulo' },
  { book: 'RM', start: 1, end: 16, era: '25. Cartas de Paulo' },
  { book: 'EF', start: 1, end: 6, era: '25. Cartas de Paulo' },
  { book: 'FP', start: 1, end: 4, era: '25. Cartas de Paulo' },
  { book: 'CL', start: 1, end: 4, era: '25. Cartas de Paulo' },
  { book: 'FM', start: 1, end: 1, era: '25. Cartas de Paulo' },
  { book: 'HB', start: 1, end: 13, era: '23. Cartas Gerais' },
  { book: '1TM', start: 1, end: 6, era: '25. Cartas de Paulo' },
  { book: 'TT', start: 1, end: 3, era: '25. Cartas de Paulo' },
  { book: '1PE', start: 1, end: 5, era: '23. Cartas Gerais' },
  { book: '2PE', start: 1, end: 3, era: '23. Cartas Gerais' },
  { book: '2TM', start: 1, end: 4, era: '25. Cartas de Paulo' },
  { book: '1JO', start: 1, end: 5, era: '23. Cartas Gerais' },
  { book: '2JO', start: 1, end: 1, era: '23. Cartas Gerais' },
  { book: '3JO', start: 1, end: 1, era: '23. Cartas Gerais' },
  { book: 'JD', start: 1, end: 1, era: '23. Cartas Gerais' },
  { book: 'AP', start: 1, end: 22, era: '26. Fim e Eternidade' }
];

export default function PlanScreen() {
  const router = useRouter();
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [expandedEra, setExpandedEra] = useState<string | null>(null); // Controla qual pasta está aberta
   
  // 1. GERAÇÃO DOS DIAS (Matemática Pura)
  const rawDays = useMemo(() => {
    let plan = [];
    let day = 1;
    let chaptersPerDay = 3.26;
    let accumulated = 0;
    
    let allChapters: any[] = [];
    CHRONO_READING_BLOCKS.forEach(block => {
        for(let c = block.start; c <= block.end; c++) {
            allChapters.push({ 
                book: block.book, 
                chapter: c, 
                name: BOOKS_INFO[block.book].name,
                era: block.era 
            });
        }
    });

    let currentCapIndex = 0;
    while (day <= 365 && currentCapIndex < allChapters.length) {
        let target = Math.round(day * chaptersPerDay);
        let chaptersToday = [];
        
        while (accumulated < target && currentCapIndex < allChapters.length) {
            chaptersToday.push(allChapters[currentCapIndex]);
            currentCapIndex++;
            accumulated++;
        }

        if (chaptersToday.length > 0) {
            let distinctReadings = [];
            if (chaptersToday.length > 0) {
                let currentBlock = { 
                    name: chaptersToday[0].name, 
                    bookId: chaptersToday[0].book, 
                    start: chaptersToday[0].chapter, 
                    end: chaptersToday[0].chapter 
                };
                for(let i=1; i<chaptersToday.length; i++) {
                    if (chaptersToday[i].book !== currentBlock.bookId) {
                        distinctReadings.push({
                           desc: `${currentBlock.name} ${currentBlock.start}${currentBlock.end > currentBlock.start ? '-' + currentBlock.end : ''}`,
                           target: { book: currentBlock.bookId, chapter: currentBlock.start }
                        });
                        currentBlock = { 
                            name: chaptersToday[i].name, 
                            bookId: chaptersToday[i].book, 
                            start: chaptersToday[i].chapter, 
                            end: chaptersToday[i].chapter 
                        };
                    } else {
                        currentBlock.end = chaptersToday[i].chapter;
                    }
                }
                distinctReadings.push({
                   desc: `${currentBlock.name} ${currentBlock.start}${currentBlock.end > currentBlock.start ? '-' + currentBlock.end : ''}`,
                   target: { book: currentBlock.bookId, chapter: currentBlock.start }
                });
            }
            plan.push({
                day,
                era: chaptersToday[0].era,
                readings: distinctReadings
            });
        }
        day++;
    }
    return plan;
  }, []);

  // 2. AGRUPAMENTO (Cria as Pastas)
  const sections = useMemo(() => {
    const grouped: { title: string, data: any[] }[] = [];
    let currentEra = null;
    let currentData: any[] = [];

    rawDays.forEach(item => {
        if (item.era !== currentEra) {
            if (currentEra) {
                grouped.push({ title: currentEra, data: currentData });
            }
            currentEra = item.era;
            currentData = [item];
        } else {
            currentData.push(item);
        }
    });
    if (currentEra) {
        grouped.push({ title: currentEra, data: currentData });
    }
    return grouped;
  }, [rawDays]);

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem('bible_plan_final');
      if (saved) setCompletedDays(JSON.parse(saved));
    } catch (e) {}
  };

  const toggleDay = async (day: number) => {
    let newCompleted;
    if (completedDays.includes(day)) {
      newCompleted = completedDays.filter(d => d !== day);
    } else {
      newCompleted = [...completedDays, day];
    }
    setCompletedDays(newCompleted);
    await AsyncStorage.setItem('bible_plan_final', JSON.stringify(newCompleted));
  };

  // Função para abrir/fechar a pasta
  const toggleSection = (title: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (expandedEra === title) {
          setExpandedEra(null); // Fecha se já tá aberto
      } else {
          setExpandedEra(title); // Abre o novo
      }
  };

  const goToReading = (target: any) => {
    if (target) {
      router.push({ 
          pathname: "/read/[book]", 
          params: { book: target.book, chapter: target.chapter, from: 'plan' } 
      });
    }
  };

  const progressPercent = (completedDays.length / 365);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 10 : 20 }]}>
        <Text style={styles.headerTitle}>Plano Histórico</Text>
        <Text style={styles.headerSubtitle}>{completedDays.length} de 365 dias concluídos</Text>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((section, index) => {
            const isOpen = expandedEra === section.title;
            // Conta quantos dias desta era foram feitos
            const completedInEra = section.data.filter(d => completedDays.includes(d.day)).length;
            const totalInEra = section.data.length;
            const isFinished = completedInEra === totalInEra && totalInEra > 0;

            return (
                <View key={index} style={styles.sectionContainer}>
                    {/* TÍTULO DA PASTA (CLICÁVEL) */}
                    <TouchableOpacity 
                        style={[styles.sectionHeader, { borderLeftColor: isFinished ? '#34C759' : '#AF52DE' }]} 
                        onPress={() => toggleSection(section.title)}
                        activeOpacity={0.8}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.sectionStats}>{completedInEra}/{totalInEra} dias</Text>
                        </View>
                        <Ionicons 
                            name={isOpen ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#8E8E93" 
                        />
                    </TouchableOpacity>

                    {/* CONTEÚDO DA PASTA (SÓ APARECE SE TIVER ABERTO) */}
                    {isOpen && (
                        <View style={styles.itemsList}>
                            {section.data.map((item) => {
                                const isDone = completedDays.includes(item.day);
                                return (
                                    <View key={item.day} style={styles.card}>
                                        <View style={styles.cardHeaderArea}>
                                            <TouchableOpacity onPress={() => toggleDay(item.day)} style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                                                {isDone && <Ionicons name="checkmark" size={18} color="#fff" />}
                                            </TouchableOpacity>
                                            <Text style={[styles.dayText, isDone && styles.textDone]}>Dia {item.day}</Text>
                                        </View>

                                        <View style={styles.readingsContainer}>
                                            {item.readings.map((reading: any, idx: number) => (
                                                <TouchableOpacity 
                                                    key={idx} 
                                                    style={styles.readingRow} 
                                                    onPress={() => goToReading(reading.target)}
                                                >
                                                    <Text style={[styles.readingText, isDone && styles.textDone]}>{reading.desc}</Text>
                                                    <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, paddingBottom: 25, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#000' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 5, marginBottom: 15 },
  
  progressBarBg: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  
  scrollContent: { padding: 15, paddingBottom: 100 },
   
  // ESTILO DA PASTA
  sectionContainer: { marginBottom: 15, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  sectionHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 15, 
      backgroundColor: '#fff',
      borderLeftWidth: 5
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#333', textTransform: 'uppercase' },
  sectionStats: { fontSize: 12, color: '#8E8E93', marginTop: 4 },

  // ESTILO DA LISTA DENTRO DA PASTA
  itemsList: { backgroundColor: '#F9F9F9', padding: 10, borderTopWidth: 1, borderTopColor: '#F2F2F7' },

  // CARTÃO DO DIA
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  cardHeaderArea: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
   
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#C7C7CC', marginRight: 15, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#34C759', borderColor: '#34C759' },
   
  dayText: { fontSize: 14, fontWeight: '700', color: '#333' },
  textDone: { color: '#C7C7CC', textDecorationLine: 'line-through' },

  readingsContainer: { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 5 },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  readingText: { fontSize: 16, fontWeight: '600', color: '#000' }
});