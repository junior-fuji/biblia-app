import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HARPA = require('../../assets/harpa_clean.json');

type HarpaVerse = {
  number?: number;
  text?: string;
};

type HarpaSong = {
  number: number;
  title: string;
  verses?: HarpaVerse[];
  coro?: string;
};

function clampFontSize(value: number) {
  return Math.max(14, Math.min(32, value));
}

function normalizeText(text?: string) {
  return String(text ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

export default function HarpaHymnScreen() {
  const router = useRouter();
  const { number } = useLocalSearchParams<{ number?: string }>();
  const [fontSize, setFontSize] = useState(18);

  const showProjector = Platform.OS === 'web';

  const hymn = useMemo<HarpaSong | undefined>(() => {
    const n = Number(number);
    const songs = Array.isArray(HARPA) ? (HARPA as HarpaSong[]) : [];
    return songs.find((h) => h.number === n);
  }, [number]);

  const verses = useMemo(() => {
    if (!hymn?.verses || !Array.isArray(hymn.verses)) return [];
    return hymn.verses.filter((verse) => normalizeText(verse?.text).length > 0);
  }, [hymn]);

  const chorus = useMemo(() => normalizeText(hymn?.coro), [hymn?.coro]);

  if (!hymn) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFoundText}>Hino não encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#0B1220" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          {showProjector && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.projectorBtn]}
              onPress={() => router.push(`/harpa/projector/${hymn.number}` as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="tv-outline" size={18} color="#fff" />
              <Text style={[styles.actionBtnText, styles.projectorBtnText]}>Projeção</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setFontSize((s) => clampFontSize(s - 1))}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setFontSize((s) => clampFontSize(s + 1))}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="musical-notes" size={18} color="#fff" />
            <Text style={styles.heroBadgeText}>Harpa</Text>
          </View>

          <View style={styles.heroRow}>
            <View style={styles.numberPill}>
              <Text style={styles.numberPillText}>{hymn.number}</Text>
            </View>

            <View style={styles.heroTextBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {hymn.title}
              </Text>
              <Text style={styles.subtitle}>Letra • Offline</Text>
            </View>
          </View>
        </View>

        {verses.map((verse, index) => (
          <View key={`verse-${verse.number ?? index}-${index}`} style={styles.section}>
            <View style={styles.card}>
              <Text
                style={[
                  styles.lyric,
                  {
                    fontSize,
                    lineHeight: Math.round(fontSize * 1.6),
                  },
                ]}
              >
                {normalizeText(verse.text)}
              </Text>
            </View>

            {chorus && index === 0 ? (
              <View style={styles.coroCard}>
                <Text
                  style={[
                    styles.lyric,
                    styles.coroText,
                    {
                      fontSize,
                      lineHeight: Math.round(fontSize * 1.6),
                    },
                  ]}
                >
                  {chorus}
                </Text>
              </View>
            ) : null}
          </View>
        ))}

        {!verses.length && chorus ? (
          <View style={styles.section}>
            <View style={styles.coroCard}>
              <Text
                style={[
                  styles.lyric,
                  styles.coroText,
                  {
                    fontSize,
                    lineHeight: Math.round(fontSize * 1.6),
                  },
                ]}
              >
                {chorus}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7FB',
    padding: 24,
  },

  notFoundText: {
    fontWeight: '800',
    color: '#0B1220',
    fontSize: 16,
    textAlign: 'center',
  },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
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
    flexShrink: 1,
  },

  backText: {
    fontWeight: '800',
    color: '#0B1220',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAF0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 48,
  },

  projectorBtn: {
    backgroundColor: '#0F62FE',
    borderColor: 'transparent',
  },

  actionBtnText: {
    fontWeight: '900',
    color: '#0B1220',
  },

  projectorBtnText: {
    color: '#FFFFFF',
    marginLeft: 6,
  },

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

  heroBadgeText: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  heroRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  heroTextBlock: {
    flex: 1,
  },

  numberPill: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  numberPillText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },

  title: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },

  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '700',
  },

  section: {
    marginTop: 14,
  },

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
    color: '#0B1220',
    fontWeight: '600',
  },

  coroText: {
    fontWeight: '900',
  },

  bottomSpacer: {
    height: 24,
  },
});