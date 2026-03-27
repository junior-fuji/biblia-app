// (arquivo completo reduzido para foco — já inclui tudo que você tinha + melhorias seguras)

import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type DailyVerseItem = {
  text: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
};

const DAILY_VERSES: DailyVerseItem[] = [
  {
    text: 'Lâmpada para os meus pés é a tua palavra...',
    reference: 'Salmos 119:105',
    book: 'SL',
    chapter: 119,
    verse: 105,
  },
  {
    text: 'Porque Deus amou o mundo de tal maneira...',
    reference: 'João 3:16',
    book: 'JOAO',
    chapter: 3,
    verse: 16,
  },
  {
    text: 'O Senhor é o meu pastor; nada me faltará.',
    reference: 'Salmos 23:1',
    book: 'SL',
    chapter: 23,
    verse: 1,
  },
  {
    text: 'Posso todas as coisas naquele que me fortalece.',
    reference: 'Filipenses 4:13',
    book: 'FP',
    chapter: 4,
    verse: 13,
  },
  {
    text: 'Entrega o teu caminho ao Senhor...',
    reference: 'Salmos 37:5',
    book: 'SL',
    chapter: 37,
    verse: 5,
  },
];

const BOOK_ID_BY_ABBREV: Record<string, number> = {
  SL: 19,
  JOAO: 43,
  FP: 50,
};

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;

  return Math.floor(diff / 86400000) + 1;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [greeting, setGreeting] = useState('Graça e Paz');
  const [quickQuery, setQuickQuery] = useState('');
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const sb = getSupabaseOrNull();
      const userId = session?.user?.id;

      if (!sb || !userId) {
        setProfileName('');
        return;
      }

      const { data } = await sb
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .maybeSingle();

      if (!mounted) return;
      setProfileName(String(data?.name ?? '').trim());
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const displayName = useMemo(() => {
    if (profileName) return profileName;
    const email = session?.user?.email;
    if (!email) return 'Visitante';
    return email.split('@')[0];
  }, [profileName, session]);

  const dailyVerse = useMemo(() => {
    const index = (getDayOfYear(new Date()) - 1) % DAILY_VERSES.length;
    return DAILY_VERSES[index];
  }, []);

  function openDailyVerse() {
    const bookId = BOOK_ID_BY_ABBREV[dailyVerse.book];
    if (!bookId) return;

    router.push({
      pathname: '/(tabs)/read/[book]',
      params: {
        book: String(bookId),
        chapter: String(dailyVerse.chapter),
        verse: String(dailyVerse.verse),
        from: 'home',
      },
    });
  }

  function handleQuickSearch() {
    const q = quickQuery.trim();
    if (q.length < 2) return;
    router.push({ pathname: '/search', params: { q } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}, {displayName}
          </Text>
        </View>

        {/* ✅ CARD AGORA CLICÁVEL */}
        <TouchableOpacity style={styles.dailyCard} onPress={openDailyVerse}>
          <Ionicons name="book" size={20} color="#fff" />
          <Text style={styles.dailyTitle}>Versículo do Dia</Text>
          <Text style={styles.dailyText}>{dailyVerse.text}</Text>
          <Text style={styles.dailyRef}>{dailyVerse.reference}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Buscar..."
          value={quickQuery}
          onChangeText={setQuickQuery}
          onSubmitEditing={handleQuickSearch}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: 20 },

  header: { marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: 'bold' },

  dailyCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  dailyTitle: { color: '#fff', marginTop: 10 },
  dailyText: { color: '#fff', marginTop: 8 },
  dailyRef: { color: '#ddd', marginTop: 10 },

  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
});