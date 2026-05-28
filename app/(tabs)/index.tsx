import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
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

type MenuItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  href: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const [greeting, setGreeting] = useState('Graça e Paz');
  const [quickQuery, setQuickQuery] = useState('');
  const [profileName, setProfileName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1100;
  const isTablet = isWeb && width >= 760 && width < 1100;

  const gridColumns = useMemo(() => {
    if (!isWeb) return 2;
    if (width >= 1400) return 5;
    if (width >= 1150) return 4;
    if (width >= 800) return 3;
    return 2;
  }, [isWeb, width]);

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        key: 'bible',
        title: 'Bíblia',
        subtitle: 'Leitura',
        icon: 'book-outline',
        iconColor: '#007AFF',
        iconBg: isDark ? '#0A84FF22' : '#E3F2FD',
        href: '/read',
      },
      {
        key: 'harpa',
        title: 'Harpa',
        subtitle: 'Hinos',
        icon: 'musical-notes-outline',
        iconColor: '#0097A7',
        iconBg: isDark ? '#0097A722' : '#E0F7FA',
        href: '/harpa',
      },
      {
        key: 'studies',
        title: 'Estudos',
        subtitle: 'Anotações',
        icon: 'create-outline',
        iconColor: '#34C759',
        iconBg: isDark ? '#34C75922' : '#E8F5E9',
        href: '/studies',
      },
      {
        key: 'plan',
        title: 'Plano',
        subtitle: 'Anual',
        icon: 'calendar-outline',
        iconColor: '#AF52DE',
        iconBg: isDark ? '#AF52DE22' : '#F3E5F5',
        href: '/plan',
      },
      {
        key: 'dictionary',
        title: 'Dicionário',
        subtitle: 'Original',
        icon: 'library-outline',
        iconColor: '#FF9500',
        iconBg: isDark ? '#FF950022' : '#FFF3E0',
        href: '/dictionary',
      },
    ],
    [isDark],
  );

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const sb = getSupabaseOrNull();
      const userId = session?.user?.id;

      if (!sb || !userId) {
        setProfileName('');
        setAvatarUrl('');
        return;
      }

      try {
        const { data, error } = await sb
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', userId)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.log('LOAD_PROFILE_HOME_ERROR', error);
          setProfileName('');
          setAvatarUrl('');
          return;
        }

        setProfileName(String(data?.name ?? '').trim());
        setAvatarUrl(String(data?.avatar_url ?? '').trim());
      } catch (error) {
        if (!mounted) return;

        console.log('LOAD_PROFILE_HOME_FATAL', error);
        setProfileName('');
        setAvatarUrl('');
      }
    }

    void loadProfile();

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

  const cardWidth = useMemo(() => {
    if (gridColumns === 5) return '18.6%';
    if (gridColumns === 4) return '23.5%';
    if (gridColumns === 3) return '31.8%';

    return '48.2%';
  }, [gridColumns]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 12) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {greeting}, {displayName}
              </Text>
              <Text style={[styles.subGreeting, { color: colors.muted }]}>
                Vamos examinar as Escrituras?
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/settings' as never)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações"
              style={styles.avatarButton}
            >
              <View style={styles.avatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{avatarLabel}</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.heroWrap, isDesktop && styles.heroWrapDesktop]}>
            <View
              style={[
                styles.dailyCard,
                isDesktop && styles.dailyCardDesktop,
              ]}
            >
              <View style={styles.dailyTopRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="book" size={18} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.dailyTitle}>Versículo do Dia</Text>
                  <Text style={styles.dailyRef}>{dailyVerse.reference}</Text>
                </View>
              </View>

              <Text style={styles.dailyText}>{dailyVerse.text}</Text>

              <TouchableOpacity
                style={styles.dailyAction}
                activeOpacity={0.85}
                onPress={() => router.push('/read' as never)}
              >
                <Text style={styles.dailyActionText}>Abrir Bíblia</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.quickPanel,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                isDesktop && styles.quickPanelDesktop,
              ]}
            >
              <Text style={[styles.quickPanelTitle, { color: colors.text }]}>
                Pesquisa Rápida
              </Text>

              <View
                style={[
                  styles.quickSearchWrap,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="search" size={18} color={colors.muted} />

                <TextInput
                  style={[styles.quickSearchInput, { color: colors.text }]}
                  placeholder="Buscar palavra na Bíblia…"
                  placeholderTextColor={colors.muted}
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
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleQuickSearch}
                    style={[
                      styles.quickGoBtn,
                      { backgroundColor: isDark ? colors.primary : '#111827' },
                    ]}
                    accessibilityLabel="Pesquisar"
                  >
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.quickMiniRow}>
                <TouchableOpacity
                  style={[
                    styles.quickMiniBtn,
                    {
                      backgroundColor: colors.cardSoft,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push('/read' as never)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="book-outline" size={16} color={colors.primary} />
                  <Text style={[styles.quickMiniText, { color: colors.text }]}>
                    Ler Bíblia
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickMiniBtn,
                    {
                      backgroundColor: colors.cardSoft,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push('/harpa' as never)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="musical-notes-outline"
                    size={16}
                    color="#0097A7"
                  />
                  <Text style={[styles.quickMiniText, { color: colors.text }]}>
                    Abrir Harpa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Menu Principal
          </Text>

          <View
            style={[
              styles.grid,
              isTablet && styles.gridTablet,
              isDesktop && styles.gridDesktop,
            ]}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(item.href as never)}
                activeOpacity={0.85}
              >
                <View style={[styles.cardIcon, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={24} color={item.iconColor} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardSub, { color: colors.muted }]}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },

  page: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  greeting: {
    fontSize: 26,
    fontWeight: '800',
  },

  subGreeting: {
    fontSize: 14,
    marginTop: 4,
  },

  avatarButton: {
    borderRadius: 24,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },

  heroWrap: {
    gap: 14,
    marginBottom: 18,
  },

  heroWrapDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  dailyCard: {
    backgroundColor: '#0F62FE',
    padding: 16,
    borderRadius: 18,
  },

  dailyCardDesktop: {
    flex: 1.1,
    minHeight: 220,
    justifyContent: 'space-between',
  },

  dailyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  iconCircle: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dailyTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  dailyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },

  dailyRef: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  dailyAction: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },

  dailyActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  quickPanel: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },

  quickPanelDesktop: {
    flex: 0.9,
    minHeight: 220,
  },

  quickPanelTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },

  quickSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },

  quickSearchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },

  quickGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickMiniRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },

  quickMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },

  quickMiniText: {
    fontSize: 13,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  gridTablet: {
    justifyContent: 'space-between',
  },

  gridDesktop: {
    justifyContent: 'space-between',
  },

  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 130,
  },

  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
});