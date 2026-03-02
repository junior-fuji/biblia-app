import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HARPA = require('../../../assets/harpa_clean.json');

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function HarpaProjectorScreen() {
  useKeepAwake();

  const router = useRouter();
  const { number } = useLocalSearchParams<{ number: string }>();
  const scrollRef = useRef<ScrollView>(null);

  // 🔥 Fonte menor e mais equilibrada
  const [fontSize, setFontSize] = useState(28);

  const currentNumber = useMemo(
    () => clamp(Number(number) || 1, 1, 640),
    [number]
  );

  const hymn = useMemo(() => {
    return HARPA.find((h: any) => h.number === currentNumber);
  }, [currentNumber]);

  const goTo = (n: number) => {
    const next = clamp(n, 1, 640);
    router.replace(`/harpa/projector/${next}`);
  };

  const next = () => goTo(currentNumber + 1);
  const prev = () => goTo(currentNumber - 1);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        router.back();
      }
      if (e.key === '+' || e.key === '=') {
        setFontSize((s) => clamp(s + 2, 20, 48));
      }
      if (e.key === '-' || e.key === '_') {
        setFontSize((s) => clamp(s - 2, 20, 48));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentNumber]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentNumber]);

  if (!hymn) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: '#fff' }}>Hino não encontrado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />

      {/* Top Minimal */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#ffffffaa" />
        </TouchableOpacity>

        <Text style={styles.topTitle} numberOfLines={1}>
          {hymn.number} — {hymn.title}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setFontSize((s) => clamp(s - 2, 20, 48))}>
            <Text style={styles.control}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFontSize((s) => clamp(s + 2, 20, 48))}>
            <Text style={styles.control}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Verso 1 */}
        <Text style={[styles.lyric, { fontSize }]}>
          {hymn.verses?.[0]?.text ?? ''}
        </Text>

        {/* Coro elegante (sem card) */}
        {hymn.coro ? (
          <Text style={[styles.lyric, styles.coro, { fontSize }]}>
            {hymn.coro}
          </Text>
        ) : null}

        {/* Demais versos */}
        {hymn.verses?.slice(1).map((v: any) => (
          <Text key={v.number} style={[styles.lyric, { fontSize }]}>
            {v.text}
          </Text>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Minimal */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={prev}>
          <Ionicons name="chevron-back" size={22} color="#ffffffaa" />
        </TouchableOpacity>

        <Text style={styles.counter}>
          {currentNumber} de 640
        </Text>

        <TouchableOpacity onPress={next}>
          <Ionicons name="chevron-forward" size={22} color="#ffffffaa" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111418',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111418',
  },

  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  topTitle: {
    color: '#ffffffcc',
    fontSize: 14,
    fontWeight: '500',
  },

  control: {
    color: '#ffffffaa',
    fontSize: 14,
    fontWeight: '600',
  },

  content: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 20,
  },

  lyric: {
    color: '#F1F1F1',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 38,
    marginBottom: 26,
    letterSpacing: 0.3,
  },

  coro: {
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomBar: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  counter: {
    color: '#ffffffaa',
    fontSize: 13,
    fontWeight: '500',
  },
});