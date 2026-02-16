import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [greeting, setGreeting] = useState('Graça e Paz');
  const [quickQuery, setQuickQuery] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 12) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, Junior</Text>
            <Text style={styles.subGreeting}>Vamos examinar as Escrituras?</Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir configurações"
          >
            <Text style={styles.avatarText}>JR</Text>
          </TouchableOpacity>
        </View>

        {/* VERSÍCULO DO DIA */}
        <View style={styles.dailyCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="book" size={20} color="#fff" />
          </View>
          <Text style={styles.dailyTitle}>Versículo do Dia</Text>
          <Text style={styles.dailyText}>
            “Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.”
          </Text>
          <Text style={styles.dailyRef}>SALMOS 119:105</Text>
        </View>

        {/* BARRA DE BUSCA */}
        <Text style={styles.sectionTitle}>Pesquisa Rápida</Text>

        <View style={styles.quickSearchWrap}>
          <Ionicons name="search" size={18} color="#8E8E93" />

          <TextInput
            style={styles.quickSearchInput}
            placeholder="Buscar palavra na Bíblia…"
            value={quickQuery}
            onChangeText={setQuickQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            onSubmitEditing={() => {
              const q = quickQuery.trim();
              if (q.length >= 2) {
                router.push({ pathname: '/search', params: { q } });
              }
            }}
          />

          {quickQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuickQuery('')}
              style={{ padding: 6 }}
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const q = quickQuery.trim();
                if (q.length >= 2) {
                  router.push({ pathname: '/search', params: { q } });
                }
              }}
              style={styles.quickGoBtn}
              accessibilityLabel="Pesquisar"
            >
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* MENU PRINCIPAL */}
        <Text style={styles.sectionTitle}>Menu Principal</Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/read')} activeOpacity={0.85}>
            <View style={[styles.cardIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="book-outline" size={24} color="#007AFF" />
            </View>
            <Text style={styles.cardTitle}>Bíblia</Text>
            <Text style={styles.cardSub}>Leitura</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/studies')} activeOpacity={0.85}>
            <View style={[styles.cardIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="create-outline" size={24} color="#34C759" />
            </View>
            <Text style={styles.cardTitle}>Estudos</Text>
            <Text style={styles.cardSub}>Anotações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/plan')} activeOpacity={0.85}>
            <View style={[styles.cardIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="calendar-outline" size={24} color="#AF52DE" />
            </View>
            <Text style={styles.cardTitle}>Plano</Text>
            <Text style={styles.cardSub}>Anual</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} 
          onPress={() => router.push({ pathname: '/(tabs)/dictionary' } as any)


} 
            activeOpacity={0.85}>
            <View style={[styles.cardIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="library-outline" size={24} color="#FF9500" />
            </View>
            <Text style={styles.cardTitle}>Dicionário</Text>
            <Text style={styles.cardSub}>Original</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  quickSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 22,
  },
  quickSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    marginLeft: 10,
  },
  quickGoBtn: {
    backgroundColor: '#111',
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#000' },
  subGreeting: { fontSize: 14, color: '#666', marginTop: 2 },
  avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#666' },

  dailyCard: { backgroundColor: '#007AFF', padding: 22, borderRadius: 20, marginBottom: 18 },
  iconCircle: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  dailyTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  dailyText: { color: '#fff', fontSize: 17, fontWeight: '600', fontStyle: 'italic', lineHeight: 25 },
  dailyRef: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 'bold', marginTop: 12, letterSpacing: 0.6 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#333' },

  searchBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: '#eee' },
  searchPlaceholder: { flex: 1, color: '#999', marginLeft: 10, fontSize: 14 },
  searchBtn: { backgroundColor: '#111', width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  card: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  cardIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#333' },
  cardSub: { fontSize: 12, color: '#999', marginTop: 2 },
});
