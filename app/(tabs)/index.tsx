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
};

const DAILY_VERSES: DailyVerseItem[] = [
  {
    text: '“Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.”',
    reference: 'SALMOS 119:105',
  },
  {
    text: '“Escondi a tua palavra no meu coração, para eu não pecar contra ti.”',
    reference: 'SALMOS 119:11',
  },
  {
    text: '“Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.”',
    reference: 'SALMOS 37:5',
  },
  {
    text: '“O Senhor é o meu pastor; nada me faltará.”',
    reference: 'SALMOS 23:1',
  },
  {
    text: '“Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes, que não sabes.”',
    reference: 'JEREMIAS 33:3',
  },
  {
    text: '“Mas os que esperam no Senhor renovarão as suas forças.”',
    reference: 'ISAÍAS 40:31',
  },
  {
    text: '“As misericórdias do Senhor são a causa de não sermos consumidos.”',
    reference: 'LAMENTAÇÕES 3:22',
  },
  {
    text: '“Bem-aventurados os que têm fome e sede de justiça, porque eles serão fartos.”',
    reference: 'MATEUS 5:6',
  },
  {
    text: '“Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.”',
    reference: 'MATEUS 6:33',
  },
  {
    text: '“Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.”',
    reference: 'MATEUS 11:28',
  },
  {
    text: '“Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.”',
    reference: 'JOÃO 3:16',
  },
  {
    text: '“Eu sou o caminho, e a verdade e a vida.”',
    reference: 'JOÃO 14:6',
  },
  {
    text: '“Conhecereis a verdade, e a verdade vos libertará.”',
    reference: 'JOÃO 8:32',
  },
  {
    text: '“Recebereis a virtude do Espírito Santo, que há de vir sobre vós.”',
    reference: 'ATOS 1:8',
  },
  {
    text: '“O justo viverá da fé.”',
    reference: 'ROMANOS 1:17',
  },
  {
    text: '“E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.”',
    reference: 'ROMANOS 8:28',
  },
  {
    text: '“Se Deus é por nós, quem será contra nós?”',
    reference: 'ROMANOS 8:31',
  },
  {
    text: '“Portanto, se alguém está em Cristo, nova criatura é.”',
    reference: '2 CORÍNTIOS 5:17',
  },
  {
    text: '“Porque pela graça sois salvos, por meio da fé.”',
    reference: 'EFÉSIOS 2:8',
  },
  {
    text: '“Não andeis ansiosos por coisa alguma.”',
    reference: 'FILIPENSES 4:6',
  },
  {
    text: '“Posso todas as coisas naquele que me fortalece.”',
    reference: 'FILIPENSES 4:13',
  },
  {
    text: '“A palavra de Cristo habite em vós abundantemente.”',
    reference: 'COLOSSENSES 3:16',
  },
  {
    text: '“Orai sem cessar.”',
    reference: '1 TESSALONICENSES 5:17',
  },
  {
    text: '“Combati o bom combate, acabei a carreira, guardei a fé.”',
    reference: '2 TIMÓTEO 4:7',
  },
  {
    text: '“A fé é o firme fundamento das coisas que se esperam.”',
    reference: 'HEBREUS 11:1',
  },
  {
    text: '“Cheguemo-nos, pois, com confiança ao trono da graça.”',
    reference: 'HEBREUS 4:16',
  },
  {
    text: '“Sede cumpridores da palavra, e não somente ouvintes.”',
    reference: 'TIAGO 1:22',
  },
  {
    text: '“Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.”',
    reference: '1 PEDRO 5:7',
  },
  {
    text: '“Deus é amor.”',
    reference: '1 JOÃO 4:8',
  },
  {
    text: '“Eis que estou à porta e bato.”',
    reference: 'APOCALIPSE 3:20',
  },
];

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;

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

      try {
        const { data, error } = await sb
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.log('LOAD_PROFILE_HOME_ERROR', error);
          setProfileName('');
          return;
        }

        setProfileName(String(data?.name ?? '').trim());
      } catch (e) {
        if (!mounted) return;
        console.log('LOAD_PROFILE_HOME_FATAL', e);
        setProfileName('');
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const displayName = useMemo(() => {
    if (profileName) return profileName;

    const email = session?.user?.email?.trim();
    if (!email) return 'Visitante';

    const base = email.split('@')[0]?.trim();
    if (!base) return 'Usuário';

    return base.charAt(0).toUpperCase() + base.slice(1);
  }, [profileName, session]);

  const avatarLabel = useMemo(() => {
    const source = profileName || session?.user?.email || 'US';
    const cleaned = source.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return cleaned.slice(0, 2) || 'US';
  }, [profileName, session]);

  const dailyVerse = useMemo(() => {
    const now = new Date();
    const dayOfYear = getDayOfYear(now);
    const index = (dayOfYear - 1) % DAILY_VERSES.length;
    return DAILY_VERSES[index];
  }, []);

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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting}, {displayName}
            </Text>
            <Text style={styles.subGreeting}>Vamos examinar as Escrituras?</Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir configurações"
          >
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dailyCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="book" size={20} color="#fff" />
          </View>
          <Text style={styles.dailyTitle}>Versículo do Dia</Text>
          <Text style={styles.dailyText}>{dailyVerse.text}</Text>
          <Text style={styles.dailyRef}>{dailyVerse.reference}</Text>
        </View>

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
            onSubmitEditing={handleQuickSearch}
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
              onPress={handleQuickSearch}
              style={styles.quickGoBtn}
              accessibilityLabel="Pesquisar"
            >
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Menu Principal</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/read')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="book-outline" size={24} color="#007AFF" />
            </View>
            <Text style={styles.cardTitle}>Bíblia</Text>
            <Text style={styles.cardSub}>Leitura</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/harpa')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#E0F7FA' }]}>
              <Ionicons name="musical-notes-outline" size={24} color="#0097A7" />
            </View>
            <Text style={styles.cardTitle}>Harpa</Text>
            <Text style={styles.cardSub}>Hinos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/studies')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="create-outline" size={24} color="#34C759" />
            </View>
            <Text style={styles.cardTitle}>Estudos</Text>
            <Text style={styles.cardSub}>Anotações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/plan')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="calendar-outline" size={24} color="#AF52DE" />
            </View>
            <Text style={styles.cardTitle}>Plano</Text>
            <Text style={styles.cardSub}>Anual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/dictionary')}
            activeOpacity={0.85}
          >
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#000' },
  subGreeting: { fontSize: 14, color: '#666', marginTop: 2 },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontWeight: 'bold', color: '#666' },

  dailyCard: {
    backgroundColor: '#007AFF',
    padding: 22,
    borderRadius: 20,
    marginBottom: 18,
  },
  iconCircle: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  dailyText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 25,
  },
  dailyRef: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    letterSpacing: 0.6,
  },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#333' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#333' },
  cardSub: { fontSize: 12, color: '#999', marginTop: 2 },
});