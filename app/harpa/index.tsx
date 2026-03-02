import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Hymn = {
  number: number;
  title: string;
  coro?: string;
  verses?: { number: number; text: string }[];
};

// ✅ Hinário completo (640)
const HARPA: Hymn[] = require('../../assets/harpa_clean.json');

export default function HarpaIndex() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
    const qRaw = query.trim();
    if (!qRaw) return HARPA;
  
    // Se for apenas número: busca EXATA
    if (/^\d+$/.test(qRaw)) {
      const n = Number(qRaw);
      return HARPA.filter((h) => h.number === n);
    }
  
    // Caso contrário: busca por texto no título
    const q = qRaw.toLowerCase();
    return HARPA.filter((h) => (h.title || '').toLowerCase().includes(q));
  }, [query]);

  const renderItem = ({ item }: { item: Hymn }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/harpa/${item.number}`)}
    >
      <View style={styles.left}>
        <View style={styles.numberPill}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.hymnTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.hymnSub} numberOfLines={1}>
          Toque para abrir
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HERO HEADER */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="musical-notes" size={18} color="#fff" />
          <Text style={styles.heroBadgeText}>Harpa Cristã</Text>
        </View>

        <Text style={styles.heroTitle}>Hinário Completo</Text>
        <Text style={styles.heroSubtitle}>{HARPA.length} hinos • Offline</Text>

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            placeholder="Buscar por número ou título..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={styles.clearBtn}
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.number)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={16}
        windowSize={11}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },

  hero: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#0F62FE',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroBadgeText: { color: '#fff', fontWeight: '900' },

  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '700' },

  searchWrap: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#0B1220',
    fontWeight: '700',
  },
  clearBtn: { padding: 6 },

  listContent: { padding: 16, paddingBottom: 30 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  left: { alignItems: 'center', justifyContent: 'center' },

  numberPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontWeight: '900', color: '#0F62FE', fontSize: 16 },

  hymnTitle: { fontSize: 16, fontWeight: '900', color: '#0B1220' },
  hymnSub: { marginTop: 2, fontSize: 12, fontWeight: '700', color: '#6B7280' },
});