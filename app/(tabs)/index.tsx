import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { useResponsiveMetrics } from '@/src/theme/useResponsiveMetrics';
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
    text: '“Não andeis ansiosos por coisa alguma.”',
    reference: 'FILIPENSES 4:6',
  },
  {
    text: '“Posso todas as coisas naquele que me fortalece.”',
    reference: 'FILIPENSES 4:13',
  },
  {
    text: '“Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.”',
    reference: '1 PEDRO 5:7',
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
  const metrics = useResponsiveMetrics();

  const [greeting, setGreeting] = useState('Graça e Paz');
  const [quickQuery, setQuickQuery] = useState('');
  const [profileName, setProfileName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1100;
  const isTablet = isWeb && width >= 760 && width < 1100;

  const pageMaxWidth =
    typeof metrics.homeMaxContentWidth === 'number'
      ? metrics.homeMaxContentWidth
      : undefined;

     const gridColumns = useMemo(() => {
  if (!isWeb) return 2;
  if (width >= 1900) return 6;
  if (width >= 1700) return 5;
  if (width >= 1440) return 4;
  if (width >= 900) return 3;
  return 2;
}, [isWeb, width]);
      const cardWidth = useMemo(() => {
        if (gridColumns === 6) return '15.4%';
        if (gridColumns === 5) return '18.6%';
        if (gridColumns === 4) return '23.5%';
        if (gridColumns === 3) return '31.8%';
      
        return '48.2%';
      }, [gridColumns]);

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
        key: 'atlas',
        title: 'Atlas',
        subtitle: 'Mapas',
        icon: 'map-outline',
        iconColor: '#C6922E',
        iconBg: isDark ? '#C6922E22' : '#FFF4D8',
        href: '/atlas',
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.page, { maxWidth: pageMaxWidth }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 12),
              paddingHorizontal: metrics.homePagePadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTextBlock}>
              <Text
                style={[
                  styles.greeting,
                  {
                    color: colors.text,
                    fontSize: metrics.homeGreetingFontSize,
                  },
                ]}
              >
                {greeting}, {displayName}
              </Text>

              <Text
                style={[
                  styles.subGreeting,
                  {
                    color: colors.muted,
                    fontSize: metrics.homeSubGreetingFontSize,
                  },
                ]}
              >
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
              <View
                style={[
                  styles.avatar,
                  {
                    width: metrics.homeAvatarSize,
                    height: metrics.homeAvatarSize,
                    borderRadius: Math.round(metrics.homeAvatarSize / 2),
                  },
                ]}
              >
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
                metrics.homeHeroMinHeight
                  ? { minHeight: metrics.homeHeroMinHeight }
                  : null,
              ]}
            >
              <View style={styles.dailyTopRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="book" size={22} color="#fff" />
                </View>

                <View style={styles.dailyTitleBlock}>
                  <Text style={styles.dailyTitle}>Versículo do Dia</Text>
                  <Text style={styles.dailyRef}>{dailyVerse.reference}</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.dailyText,
                  metrics.isLargeDesktop && styles.dailyTextDesktop,
                  metrics.isImacSize && styles.dailyTextImac,
                ]}
              >
                {dailyVerse.text}
              </Text>

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
                metrics.homeHeroMinHeight
                  ? { minHeight: metrics.homeHeroMinHeight }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.quickPanelTitle,
                  {
                    color: colors.text,
                    fontSize: metrics.homeQuickTitleFontSize,
                  },
                ]}
              >
                Pesquisa Rápida
              </Text>

              <View
                style={[
                  styles.quickSearchWrap,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  metrics.isLargeDesktop && styles.quickSearchWrapDesktop,
                ]}
              >
                <Ionicons name="search" size={20} color={colors.muted} />

                <TextInput
                  style={[
                    styles.quickSearchInput,
                    {
                      color: colors.text,
                      fontSize: metrics.homeQuickInputFontSize,
                    },
                  ]}
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
                    style={styles.clearSearchBtn}
                    accessibilityLabel="Limpar busca"
                  >
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
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
                    metrics.isLargeDesktop && styles.quickMiniBtnDesktop,
                  ]}
                  onPress={() => router.push('/read' as never)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="book-outline" size={18} color={colors.primary} />
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
                    metrics.isLargeDesktop && styles.quickMiniBtnDesktop,
                  ]}
                  onPress={() => router.push('/harpa' as never)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="musical-notes-outline"
                    size={18}
                    color="#0097A7"
                  />
                  <Text style={[styles.quickMiniText, { color: colors.text }]}>
                    Abrir Harpa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
                fontSize: metrics.homeSectionTitleFontSize,
              },
            ]}
          >
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
                    minHeight: metrics.homeCardMinHeight,
                    padding: metrics.homeCardPadding,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(item.href as never)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.cardIcon,
                    {
                      width: metrics.homeCardIconBoxSize,
                      height: metrics.homeCardIconBoxSize,
                      borderRadius: Math.round(
                        metrics.homeCardIconBoxSize * 0.26,
                      ),
                      backgroundColor: item.iconBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={metrics.homeCardIconSize}
                    color={item.iconColor}
                  />
                </View>

                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: colors.text,
                      fontSize: metrics.homeCardTitleFontSize,
                    },
                  ]}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    styles.cardSub,
                    {
                      color: colors.muted,
                      fontSize: metrics.homeCardSubtitleFontSize,
                    },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
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
  },

  scrollContent: {
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    fontWeight: '800',
  },

  subGreeting: {
    marginTop: 4,
  },

  avatarButton: {
    borderRadius: 999,
  },

  avatar: {
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
    padding: 18,
    borderRadius: 18,
  },

  dailyCardDesktop: {
    flex: 1.15,
    justifyContent: 'space-between',
  },

  dailyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  dailyTitleBlock: {
    flex: 1,
  },

  iconCircle: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dailyTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
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

  dailyTextDesktop: {
    fontSize: 18,
    lineHeight: 27,
  },

  dailyTextImac: {
    fontSize: 22,
    lineHeight: 32,
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
    padding: 18,
    borderWidth: 1,
  },

  quickPanelDesktop: {
    flex: 0.85,
    justifyContent: 'center',
  },

  quickPanelTitle: {
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

  quickSearchWrapDesktop: {
    height: 58,
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  quickSearchInput: {
    flex: 1,
    marginLeft: 10,
  },

  clearSearchBtn: {
    padding: 6,
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

  quickMiniBtnDesktop: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  quickMiniText: {
    fontSize: 13,
    fontWeight: '700',
  },

  sectionTitle: {
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
    borderRadius: 18,
    borderWidth: 1,
  },

  cardIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  cardTitle: {
    fontWeight: '800',
  },

  cardSub: {
    marginTop: 3,
  },

  bottomSpacer: {
    height: 24,
  },
});