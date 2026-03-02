import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HARPA = require('../../assets/harpa_clean.json');

export default function HarpaHymnScreen() {
  const router = useRouter();
  const { number } = useLocalSearchParams<{ number: string }>();
  const [fontSize, setFontSize] = useState(18);

  const hymn = useMemo(() => {
    const n = Number(number);
    return HARPA.find((h: any) => h.number === n);
  }, [number]);

  if (!hymn) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ fontWeight: '800' }}>Hino não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const clamp = (v: number) => Math.max(14, Math.min(32, v));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bonito */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#0B1220" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.fontControls}>
          <TouchableOpacity
            style={styles.fontBtn}
            onPress={() => setFontSize((s) => clamp(s - 1))}
            activeOpacity={0.85}
          >
            <Text style={styles.fontBtnText}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fontBtn}
            onPress={() => setFontSize((s) => clamp(s + 1))}
            activeOpacity={0.85}
          >
            <Text style={styles.fontBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>
<TouchableOpacity
  style={[styles.fontBtn, { backgroundColor: '#0F62FE', borderColor: 'transparent' }]}
  onPress={() => router.push(`/harpa/projector/${hymn.number}`)}
  activeOpacity={0.85}
>
  <Ionicons name="tv-outline" size={18} color="#fff" />
  <Text style={[styles.fontBtnText, { color: '#fff' }]}>Projeção</Text>
</TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="musical-notes" size={18} color="#fff" />
            <Text style={styles.heroBadgeText}>Harpa</Text>
          </View>

          <View style={styles.heroRow}>
            <View style={styles.numberPill}>
              <Text style={styles.numberPillText}>{hymn.number}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={2}>
                {hymn.title}
              </Text>
              <Text style={styles.subtitle}>Letra • Offline</Text>
            </View>
          </View>
        </View>

        {/* Conteúdo */}
        {hymn.verses.map((v: any, index: number) => (
          <View key={v.number} style={{ marginTop: 14 }}>
            {/* Verso card */}
            <View style={styles.card}>
              <Text style={[styles.lyric, { fontSize, lineHeight: Math.round(fontSize * 1.6) }]}>
                {v.text}
              </Text>
            </View>

            {/* Coro após o primeiro verso */}
            {hymn.coro && index === 0 ? (
              <View style={styles.coroCard}>
                <Text
                  style={[
                    styles.lyric,
                    styles.coroText,
                    { fontSize, lineHeight: Math.round(fontSize * 1.6) },
                  ]}
                >
                  {hymn.coro}
                </Text>
              </View>
            ) : null}
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Fundo “premium” (bem leve)
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { padding: 16, paddingBottom: 30 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAF0',
  },
  backText: { fontWeight: '800', color: '#0B1220' },

  fontControls: { flexDirection: 'row', gap: 10 },
  fontBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAF0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  fontBtnText: { fontWeight: '900', color: '#0B1220' },

  hero: {
    backgroundColor: '#0F62FE',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0F62FE',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroBadgeText: { color: '#fff', fontWeight: '900', letterSpacing: 0.2 },

  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },

  numberPill: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberPillText: { color: '#fff', fontWeight: '900', fontSize: 20 },

  title: { color: '#fff', fontWeight: '900', fontSize: 20 },
  subtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '700' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EAF0',
  },

  coroCard: {
    marginTop: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },

  lyric: {
    textAlign: 'center',
     color: '#0B1220', fontWeight: '600' },
  coroText: { fontWeight: '900' },
});