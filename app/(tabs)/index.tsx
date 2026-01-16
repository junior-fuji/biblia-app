import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const VERSES = [
  { text: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.", ref: "Salmos 119:105" },
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
];

export default function HomeScreen() {
  const router = useRouter();
  const [verse, setVerse] = useState(VERSES[0]);
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // NOVOS ESTADOS PARA PERFIL
  const [userName, setUserName] = useState('Junior');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Carrega os dados toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    // 1. Carrega Perfil (Nome e Foto)
    try {
        const savedName = await AsyncStorage.getItem('user_name');
        const savedAvatar = await AsyncStorage.getItem('user_avatar');
        
        if (savedName) setUserName(savedName);
        if (savedAvatar) setUserAvatar(savedAvatar);
    } catch (e) {}

    // 2. Carrega Progresso do Plano
    try {
      const savedPlan = await AsyncStorage.getItem('bible_plan_final');
      if (savedPlan) {
        const completed = JSON.parse(savedPlan);
        setCompletedCount(completed.length);
        setProgress(completed.length / 365);
      }
    } catch (e) {}

    // 3. Versículo Aleatório (Só se quiser mudar sempre que entrar)
    // const random = VERSES[Math.floor(Math.random() * VERSES.length)];
    // setVerse(random);
  };

  const executeSearch = () => {
    Keyboard.dismiss();
    if (searchText.trim() !== '') {
        router.push({
            pathname: '/(tabs)/read',
            params: { q: searchText.trim() } 
        });
        setSearchText('');
    } else {
        router.push('/(tabs)/read');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER FIXO */}
      <View style={styles.fixedHeader}>
          <View style={styles.headerTop}>
            <View>
                <Text style={styles.greeting}>Graça e Paz,</Text>
                {/* NOME DINÂMICO AQUI */}
                <Text style={styles.username}>{userName}</Text>
            </View>
            
            {/* BOTÃO DE PERFIL COM FOTO */}
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/settings')}>
                {userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={styles.profileImage} />
                ) : (
                    <Ionicons name="person-circle" size={45} color="#E5E5EA" />
                )}
            </TouchableOpacity>
          </View>

          {/* BARRA DE BUSCA */}
          <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#8E8E93" style={{marginLeft: 10}} />
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Buscar livro ou palavra..."
                    placeholderTextColor="#8E8E93"
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={executeSearch}
                    returnKeyType="search"
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={executeSearch} style={styles.searchBtn}>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
          </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* CARD VERSÍCULO */}
        <View style={styles.verseCard}>
            <View style={styles.verseHeader}>
                <Ionicons name="sunny" size={20} color="#fff" style={{marginRight:5}}/>
                <Text style={styles.verseLabel}>Versículo do Dia</Text>
            </View>
            <Text style={styles.verseText}>"{verse.text}"</Text>
            <Text style={styles.verseRef}>{verse.ref}</Text>
        </View>

        {/* CARD PLANO */}
        <TouchableOpacity style={styles.progressCard} onPress={() => router.push('/(tabs)/plan')} activeOpacity={0.9}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Plano Anual</Text>
                <Text style={styles.progressPercent}>{(progress * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressSubtitle}>{completedCount} dias concluídos. Continue avançando!</Text>
        </TouchableOpacity>

        {/* MENU RÁPIDO */}
        <Text style={styles.sectionTitle}>Menu Rápido</Text>
        <View style={styles.grid}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/read')}>
                <View style={[styles.gridIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="book-outline" size={28} color="#007AFF" />
                </View>
                <Text style={styles.gridText}>Bíblia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/explore')}>
                <View style={[styles.gridIcon, { backgroundColor: '#F3E5F5' }]}>
                    <Ionicons name="journal-outline" size={28} color="#AF52DE" />
                </View>
                <Text style={styles.gridText}>Diário</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/study')}>
                <View style={[styles.gridIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="document-text-outline" size={28} color="#34C759" />
                </View>
                <Text style={styles.gridText}>Meus Estudos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(tabs)/atlas')}>
                <View style={[styles.gridIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="library-outline" size={28} color="#FF9500" />
                </View>
                <Text style={styles.gridText}>Dicionário</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  
  fixedHeader: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  greeting: { fontSize: 16, color: '#8E8E93' },
  username: { fontSize: 28, fontWeight: '800', color: '#000' },
  
  profileBtn: { padding: 5 },
  profileImage: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#eee' }, // Estilo da foto

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, height: 50, overflow:'hidden' },
  searchInput: { flex: 1, fontSize: 16, color: '#000', paddingHorizontal: 10, height: '100%' },
  searchBtn: { backgroundColor: '#007AFF', width: 40, height: 40, borderRadius: 20, margin: 5, justifyContent:'center', alignItems:'center' },

  scrollContent: { padding: 20 },

  verseCard: { backgroundColor: '#007AFF', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#007AFF', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  verseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  verseLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  verseText: { fontSize: 18, color: '#fff', fontWeight: '600', lineHeight: 26, fontStyle: 'italic' },
  verseRef: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 10, fontWeight: '700', textAlign: 'right' },

  progressCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  progressPercent: { fontSize: 16, fontWeight: '800', color: '#34C759' },
  progressBarBg: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  progressSubtitle: { fontSize: 12, color: '#8E8E93' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  gridIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridText: { fontSize: 14, fontWeight: '600', color: '#333' }
});