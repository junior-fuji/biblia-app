import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ReadingTarget = {
  book: string;
  chapter: number;
};

type ReadingItem = {
  desc: string;
  target: ReadingTarget;
};

type DayItem = {
  day: number;
  era: string;
  readings: ReadingItem[];
};

type ChronoBlock = {
  book: string;
  start: number;
  end: number;
  era: string;
};

const BOOKS_INFO: Record<string, { name: string; caps: number }> = {
  GN: { name: 'Gênesis', caps: 50 },
  EX: { name: 'Êxodo', caps: 40 },
  LV: { name: 'Levítico', caps: 27 },
  NM: { name: 'Números', caps: 36 },
  DT: { name: 'Deuteronômio', caps: 34 },
  JS: { name: 'Josué', caps: 24 },
  JZ: { name: 'Juízes', caps: 21 },
  RT: { name: 'Rute', caps: 4 },
  '1SM': { name: '1 Samuel', caps: 31 },
  '2SM': { name: '2 Samuel', caps: 24 },
  '1RS': { name: '1 Reis', caps: 22 },
  '2RS': { name: '2 Reis', caps: 25 },
  '1CR': { name: '1 Crônicas', caps: 29 },
  '2CR': { name: '2 Crônicas', caps: 36 },
  ED: { name: 'Esdras', caps: 10 },
  NE: { name: 'Neemias', caps: 13 },
  ET: { name: 'Ester', caps: 10 },
  JO: { name: 'Jó', caps: 42 },
  SL: { name: 'Salmos', caps: 150 },
  PV: { name: 'Provérbios', caps: 31 },
  EC: { name: 'Eclesiastes', caps: 12 },
  CT: { name: 'Cânticos', caps: 8 },
  IS: { name: 'Isaías', caps: 66 },
  JR: { name: 'Jeremias', caps: 52 },
  LM: { name: 'Lamentações', caps: 5 },
  EZ: { name: 'Ezequiel', caps: 48 },
  DN: { name: 'Daniel', caps: 12 },
  OS: { name: 'Oseias', caps: 14 },
  JL: { name: 'Joel', caps: 3 },
  AM: { name: 'Amós', caps: 9 },
  OB: { name: 'Obadias', caps: 1 },
  JN: { name: 'Jonas', caps: 4 },
  MQ: { name: 'Miqueias', caps: 7 },
  NA: { name: 'Naum', caps: 3 },
  HC: { name: 'Habacuque', caps: 3 },
  SF: { name: 'Sofonias', caps: 3 },
  AG: { name: 'Ageu', caps: 2 },
  ZC: { name: 'Zacarias', caps: 14 },
  ML: { name: 'Malaquias', caps: 4 },
  MT: { name: 'Mateus', caps: 28 },
  MC: { name: 'Marcos', caps: 16 },
  LC: { name: 'Lucas', caps: 24 },
  JOAO: { name: 'João', caps: 21 },
  AT: { name: 'Atos', caps: 28 },
  RM: { name: 'Romanos', caps: 16 },
  '1CO': { name: '1 Coríntios', caps: 16 },
  '2CO': { name: '2 Coríntios', caps: 13 },
  GL: { name: 'Gálatas', caps: 6 },
  EF: { name: 'Efésios', caps: 6 },
  FP: { name: 'Filipenses', caps: 4 },
  CL: { name: 'Colossenses', caps: 4 },
  '1TS': { name: '1 Tessalonicenses', caps: 5 },
  '2TS': { name: '2 Tessalonicenses', caps: 3 },
  '1TM': { name: '1 Timóteo', caps: 6 },
  '2TM': { name: '2 Timóteo', caps: 4 },
  TT: { name: 'Tito', caps: 3 },
  FM: { name: 'Filemom', caps: 1 },
  HB: { name: 'Hebreus', caps: 13 },
  TG: { name: 'Tiago', caps: 5 },
  '1PE': { name: '1 Pedro', caps: 5 },
  '2PE': { name: '2 Pedro', caps: 3 },
  '1JO': { name: '1 João', caps: 5 },
  '2JO': { name: '2 João', caps: 1 },
  '3JO': { name: '3 João', caps: 1 },
  JD: { name: 'Judas', caps: 1 },
  AP: { name: 'Apocalipse', caps: 22 },
};

const BOOK_ID_BY_ABBREV: Record<string, number> = {
  GN: 1,
  EX: 2,
  LV: 3,
  NM: 4,
  DT: 5,
  JS: 6,
  JZ: 7,
  RT: 8,
  '1SM': 9,
  '2SM': 10,
  '1RS': 11,
  '2RS': 12,
  '1CR': 13,
  '2CR': 14,
  ED: 15,
  NE: 16,
  ET: 17,
  JO: 18,
  SL: 19,
  PV: 20,
  EC: 21,
  CT: 22,
  IS: 23,
  JR: 24,
  LM: 25,
  EZ: 26,
  DN: 27,
  OS: 28,
  JL: 29,
  AM: 30,
  OB: 31,
  JN: 32,
  MQ: 33,
  NA: 34,
  HC: 35,
  SF: 36,
  AG: 37,
  ZC: 38,
  ML: 39,
  MT: 40,
  MC: 41,
  LC: 42,
  JOAO: 43,
  AT: 44,
  RM: 45,
  '1CO': 46,
  '2CO': 47,
  GL: 48,
  EF: 49,
  FP: 50,
  CL: 51,
  '1TS': 52,
  '2TS': 53,
  '1TM': 54,
  '2TM': 55,
  TT: 56,
  FM: 57,
  HB: 58,
  TG: 59,
  '1PE': 60,
  '2PE': 61,
  '1JO': 62,
  '2JO': 63,
  '3JO': 64,
  JD: 65,
  AP: 66,
};

/**
 * Plano em ordem aproximada dos acontecimentos.
 * Não é ordem de escrita.
 * Também não é simples ordem canônica.
 *
 * Prioridades práticas:
 * 1) coerência histórica geral
 * 2) manter a Bíblia inteira
 * 3) preservar estabilidade do app
 * 4) não quebrar progresso salvo nem navegação existente
 *
 * Pontos discutíveis:
 * - posição exata de Jó
 * - data de Joel e Obadias
 * - encaixe fino de vários Salmos
 * - autoria/data de Hebreus
 *
 * Escolha prática:
 * Os Salmos foram redistribuídos dentro do mesmo plano único,
 * em blocos historicamente mais plausíveis, sem criar um segundo plano.
 */
const CHRONO_READING_BLOCKS: ChronoBlock[] = [
  { book: 'GN', start: 1, end: 11, era: '1. Criação, Queda e Primeiras Civilizações' },

  { book: 'JO', start: 1, end: 42, era: '2. Era Patriarcal (Jó)' },
  { book: 'GN', start: 12, end: 50, era: '3. Patriarcas: Abraão, Isaque, Jacó e José' },

  { book: 'EX', start: 1, end: 18, era: '4. Libertação do Egito' },
  { book: 'SL', start: 90, end: 90, era: '4. Libertação do Egito' },

  { book: 'EX', start: 19, end: 40, era: '5. Sinai, Aliança e Tabernáculo' },
  { book: 'LV', start: 1, end: 27, era: '5. Sinai, Aliança e Tabernáculo' },

  { book: 'NM', start: 1, end: 36, era: '6. Peregrinação no Deserto' },
  { book: 'DT', start: 1, end: 34, era: '7. Últimos Discursos de Moisés' },

  { book: 'JS', start: 1, end: 24, era: '8. Conquista de Canaã' },

  { book: 'JZ', start: 1, end: 21, era: '9. Período dos Juízes' },
  { book: 'RT', start: 1, end: 4, era: '9. Período dos Juízes' },

  { book: '1SM', start: 1, end: 15, era: '10. Samuel e a Transição para a Monarquia' },
  { book: '1SM', start: 16, end: 31, era: '11. Saul e a Ascensão de Davi' },

  { book: 'SL', start: 1, end: 2, era: '12. Ascensão de Davi e Formação do Reino' },
  { book: 'SL', start: 3, end: 41, era: '12. Ascensão de Davi e Formação do Reino' },

  { book: '2SM', start: 1, end: 24, era: '13. Reinado de Davi' },
  { book: '1CR', start: 10, end: 29, era: '13. Reinado de Davi' },

  { book: 'SL', start: 51, end: 72, era: '14. Salmos no Contexto de Davi' },
  { book: 'SL', start: 101, end: 103, era: '14. Salmos no Contexto de Davi' },
  { book: 'SL', start: 108, end: 110, era: '14. Salmos no Contexto de Davi' },
  { book: 'SL', start: 138, end: 145, era: '14. Salmos no Contexto de Davi' },

  { book: '1RS', start: 1, end: 11, era: '15. Salomão' },
  { book: '2CR', start: 1, end: 9, era: '15. Salomão' },

  { book: 'PV', start: 1, end: 31, era: '16. Sabedoria de Salomão' },
  { book: 'EC', start: 1, end: 12, era: '16. Sabedoria de Salomão' },
  { book: 'CT', start: 1, end: 8, era: '16. Sabedoria de Salomão' },
  { book: 'SL', start: 42, end: 50, era: '17. Culto, Monarquia e Adoração em Israel' },

  { book: '1RS', start: 12, end: 16, era: '18. Reino Dividido Inicial' },
  { book: '2CR', start: 10, end: 16, era: '18. Reino Dividido Inicial' },

  { book: 'OB', start: 1, end: 1, era: '19. Primeiros Profetas do Reino Dividido' },
  { book: 'JL', start: 1, end: 3, era: '19. Primeiros Profetas do Reino Dividido' },

  { book: '1RS', start: 17, end: 22, era: '20. Conflitos Proféticos no Reino Dividido' },
  { book: '2CR', start: 17, end: 20, era: '20. Conflitos Proféticos no Reino Dividido' },
  { book: 'JN', start: 1, end: 4, era: '20. Conflitos Proféticos no Reino Dividido' },
  { book: 'AM', start: 1, end: 9, era: '20. Conflitos Proféticos no Reino Dividido' },
  { book: 'OS', start: 1, end: 14, era: '20. Conflitos Proféticos no Reino Dividido' },
  { book: 'SL', start: 73, end: 83, era: '20. Conflitos Proféticos no Reino Dividido' },

  { book: '2RS', start: 1, end: 17, era: '21. Queda do Reino do Norte e Crise em Judá' },
  { book: '2CR', start: 21, end: 28, era: '21. Queda do Reino do Norte e Crise em Judá' },
  { book: 'IS', start: 1, end: 39, era: '21. Queda do Reino do Norte e Crise em Judá' },
  { book: 'MQ', start: 1, end: 7, era: '21. Queda do Reino do Norte e Crise em Judá' },
  { book: 'SL', start: 84, end: 89, era: '21. Queda do Reino do Norte e Crise em Judá' },

  { book: 'NA', start: 1, end: 3, era: '22. Últimos Anos antes do Exílio' },
  { book: 'SF', start: 1, end: 3, era: '22. Últimos Anos antes do Exílio' },
  { book: 'HC', start: 1, end: 3, era: '22. Últimos Anos antes do Exílio' },
  { book: 'JR', start: 1, end: 39, era: '22. Últimos Anos antes do Exílio' },

  { book: '2RS', start: 18, end: 25, era: '23. Queda de Judá e Exílio' },
  { book: '2CR', start: 29, end: 36, era: '23. Queda de Judá e Exílio' },
  { book: 'JR', start: 40, end: 52, era: '23. Queda de Judá e Exílio' },
  { book: 'LM', start: 1, end: 5, era: '23. Queda de Judá e Exílio' },
  { book: 'SL', start: 91, end: 100, era: '23. Queda de Judá e Exílio' },
  { book: 'SL', start: 104, end: 107, era: '23. Queda de Judá e Exílio' },
  { book: 'SL', start: 137, end: 137, era: '23. Queda de Judá e Exílio' },

  { book: 'DN', start: 1, end: 12, era: '24. Exílio Babilônico' },
  { book: 'EZ', start: 1, end: 48, era: '24. Exílio Babilônico' },

  { book: 'ED', start: 1, end: 6, era: '25. Retorno e Reconstrução' },
  { book: 'AG', start: 1, end: 2, era: '25. Retorno e Reconstrução' },
  { book: 'ZC', start: 1, end: 8, era: '25. Retorno e Reconstrução' },
  { book: 'ET', start: 1, end: 10, era: '25. Retorno e Reconstrução' },
  { book: 'ED', start: 7, end: 10, era: '25. Retorno e Reconstrução' },
  { book: 'NE', start: 1, end: 13, era: '25. Retorno e Reconstrução' },
  { book: 'ZC', start: 9, end: 14, era: '25. Retorno e Reconstrução' },
  { book: 'ML', start: 1, end: 4, era: '25. Retorno e Reconstrução' },

  { book: 'SL', start: 111, end: 118, era: '26. Salmos do Retorno e Louvor Comunitário' },
  { book: 'SL', start: 119, end: 119, era: '26. Salmos do Retorno e Louvor Comunitário' },
  { book: 'SL', start: 120, end: 136, era: '26. Salmos do Retorno e Louvor Comunitário' },
  { book: 'SL', start: 146, end: 150, era: '26. Salmos do Retorno e Louvor Comunitário' },

  { book: 'LC', start: 1, end: 24, era: '27. Vida e Ministério de Jesus' },
  { book: 'MT', start: 1, end: 28, era: '27. Vida e Ministério de Jesus' },
  { book: 'MC', start: 1, end: 16, era: '27. Vida e Ministério de Jesus' },
  { book: 'JOAO', start: 1, end: 21, era: '27. Vida e Ministério de Jesus' },

  { book: 'AT', start: 1, end: 8, era: '28. Igreja Primitiva' },
  { book: 'TG', start: 1, end: 5, era: '28. Igreja Primitiva' },
  { book: 'AT', start: 9, end: 12, era: '28. Igreja Primitiva' },

  { book: 'AT', start: 13, end: 14, era: '29. Primeira Viagem Missionária de Paulo' },
  { book: 'GL', start: 1, end: 6, era: '29. Primeira Viagem Missionária de Paulo' },

  { book: 'AT', start: 15, end: 18, era: '30. Expansão Missionária da Igreja' },
  { book: '1TS', start: 1, end: 5, era: '30. Expansão Missionária da Igreja' },
  { book: '2TS', start: 1, end: 3, era: '30. Expansão Missionária da Igreja' },

  { book: 'AT', start: 19, end: 19, era: '31. Ministério em Éfeso e Correspondências' },
  { book: '1CO', start: 1, end: 16, era: '31. Ministério em Éfeso e Correspondências' },

  { book: 'AT', start: 20, end: 20, era: '32. Macedônia, Grécia e Novas Cartas' },
  { book: '2CO', start: 1, end: 13, era: '32. Macedônia, Grécia e Novas Cartas' },
  { book: 'RM', start: 1, end: 16, era: '32. Macedônia, Grécia e Novas Cartas' },

  { book: 'AT', start: 21, end: 28, era: '33. Prisão de Paulo e Cartas da Prisão' },
  { book: 'EF', start: 1, end: 6, era: '33. Prisão de Paulo e Cartas da Prisão' },
  { book: 'FP', start: 1, end: 4, era: '33. Prisão de Paulo e Cartas da Prisão' },
  { book: 'CL', start: 1, end: 4, era: '33. Prisão de Paulo e Cartas da Prisão' },
  { book: 'FM', start: 1, end: 1, era: '33. Prisão de Paulo e Cartas da Prisão' },

  { book: '1TM', start: 1, end: 6, era: '34. Cartas Pastorais e Fim do Ministério Paulino' },
  { book: 'TT', start: 1, end: 3, era: '34. Cartas Pastorais e Fim do Ministério Paulino' },
  { book: '2TM', start: 1, end: 4, era: '34. Cartas Pastorais e Fim do Ministério Paulino' },

  { book: 'HB', start: 1, end: 13, era: '35. Cartas Gerais e Consolidação da Igreja' },
  { book: '1PE', start: 1, end: 5, era: '35. Cartas Gerais e Consolidação da Igreja' },
  { book: '2PE', start: 1, end: 3, era: '35. Cartas Gerais e Consolidação da Igreja' },
  { book: '1JO', start: 1, end: 5, era: '35. Cartas Gerais e Consolidação da Igreja' },
  { book: '2JO', start: 1, end: 1, era: '35. Cartas Gerais e Consolidação da Igreja' },
  { book: '3JO', start: 1, end: 1, era: '35. Cartas Gerais e Consolidação da Igreja' },
  { book: 'JD', start: 1, end: 1, era: '35. Cartas Gerais e Consolidação da Igreja' },

  { book: 'AP', start: 1, end: 22, era: '36. Consumação, Juízo e Eternidade' },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function PlanScreen() {
  const router = useRouter();
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [expandedEra, setExpandedEra] = useState<string | null>(null);

  const rawDays: DayItem[] = useMemo(() => {
    const allChapters: { book: string; chapter: number; name: string; era: string }[] = [];

    CHRONO_READING_BLOCKS.forEach((block) => {
      for (let c = block.start; c <= block.end; c++) {
        allChapters.push({
          book: block.book,
          chapter: c,
          name: BOOKS_INFO[block.book]?.name ?? block.book,
          era: block.era,
        });
      }
    });

    const plan: DayItem[] = [];
    let currentCapIndex = 0;

    for (let day = 1; day <= 365 && currentCapIndex < allChapters.length; day++) {
      const remainingChapters = allChapters.length - currentCapIndex;
      const remainingDays = 366 - day;
      const chaptersTodayCount = clamp(Math.round(remainingChapters / remainingDays), 1, 6);

      const chaptersToday = allChapters.slice(
        currentCapIndex,
        currentCapIndex + chaptersTodayCount
      );

      currentCapIndex += chaptersToday.length;

      if (!chaptersToday.length) continue;

      const distinctReadings: ReadingItem[] = [];

      let currentBlock = {
        name: chaptersToday[0].name,
        book: chaptersToday[0].book,
        start: chaptersToday[0].chapter,
        end: chaptersToday[0].chapter,
      };

      for (let i = 1; i < chaptersToday.length; i++) {
        const current = chaptersToday[i];

        if (current.book !== currentBlock.book) {
          distinctReadings.push({
            desc: `${currentBlock.name} ${currentBlock.start}${
              currentBlock.end > currentBlock.start ? `-${currentBlock.end}` : ''
            }`,
            target: { book: currentBlock.book, chapter: currentBlock.start },
          });

          currentBlock = {
            name: current.name,
            book: current.book,
            start: current.chapter,
            end: current.chapter,
          };
        } else {
          currentBlock.end = current.chapter;
        }
      }

      distinctReadings.push({
        desc: `${currentBlock.name} ${currentBlock.start}${
          currentBlock.end > currentBlock.start ? `-${currentBlock.end}` : ''
        }`,
        target: { book: currentBlock.book, chapter: currentBlock.start },
      });

      plan.push({
        day,
        era: chaptersToday[0].era,
        readings: distinctReadings,
      });
    }

    return plan;
  }, []);

  const sections = useMemo(() => {
    const grouped: { title: string; data: DayItem[] }[] = [];
    let currentEra: string | null = null;
    let currentData: DayItem[] = [];

    rawDays.forEach((item) => {
      if (item.era !== currentEra) {
        if (currentEra) grouped.push({ title: currentEra, data: currentData });
        currentEra = item.era;
        currentData = [item];
      } else {
        currentData.push(item);
      }
    });

    if (currentEra) grouped.push({ title: currentEra, data: currentData });
    return grouped;
  }, [rawDays]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('bible_plan_final');
        if (saved) setCompletedDays(JSON.parse(saved));
      } catch {}
    })();
  }, []);

  const toggleDay = async (day: number) => {
    const newCompleted = completedDays.includes(day)
      ? completedDays.filter((d) => d !== day)
      : [...completedDays, day];

    setCompletedDays(newCompleted);
    await AsyncStorage.setItem('bible_plan_final', JSON.stringify(newCompleted));
  };

  const toggleSection = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedEra((prev) => (prev === title ? null : title));
  };

  const goToReading = (target: ReadingTarget) => {
    const bookId = BOOK_ID_BY_ABBREV[target.book];
    const chapterNumber = target.chapter;

    if (!Number.isFinite(bookId) || bookId <= 0) {
      console.log('BookId inválido para', target.book);
      return;
    }

    if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) return;

    router.push({
      pathname: '/(tabs)/read/[book]',
      params: {
        book: String(bookId),
        chapter: String(chapterNumber),
        from: 'plan',
        returnTo: '/(tabs)/plan',
      },
    });
  };

  const progressPercent = completedDays.length / 365;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Plano Cronológico</Text>
          <Text style={styles.headerSubtitle}>{completedDays.length} de 365 dias</Text>
        </View>

        <View style={{ width: 30 }} />
      </View>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((section, index) => {
          const isOpen = expandedEra === section.title;
          const completedInEra = section.data.filter((d) => completedDays.includes(d.day)).length;
          const totalInEra = section.data.length;
          const isFinished = completedInEra === totalInEra && totalInEra > 0;

          return (
            <View key={index} style={styles.sectionContainer}>
              <TouchableOpacity
                style={[
                  styles.sectionHeader,
                  { borderLeftColor: isFinished ? '#34C759' : '#AF52DE' },
                ]}
                onPress={() => toggleSection(section.title)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionStats}>
                    {completedInEra}/{totalInEra} dias
                  </Text>
                </View>

                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#8E8E93"
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.itemsList}>
                  {section.data.map((item) => {
                    const isDone = completedDays.includes(item.day);

                    return (
                      <View key={item.day} style={styles.card}>
                        <View style={styles.cardHeaderArea}>
                          <TouchableOpacity
                            onPress={() => toggleDay(item.day)}
                            style={[styles.checkbox, isDone && styles.checkboxChecked]}
                          >
                            {isDone && <Ionicons name="checkmark" size={18} color="#fff" />}
                          </TouchableOpacity>

                          <Text style={[styles.dayText, isDone && styles.textDone]}>
                            Dia {item.day}
                          </Text>
                        </View>

                        <View style={styles.readingsContainer}>
                          {item.readings.map((reading, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.readingRow}
                              onPress={() => goToReading(reading.target)}
                            >
                              <Text style={[styles.readingText, isDone && styles.textDone]}>
                                {reading.desc}
                              </Text>
                              <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93' },

  progressBarBg: { height: 4, backgroundColor: '#E5E5EA', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#34C759' },

  scrollContent: { padding: 15, paddingBottom: 100 },

  sectionContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderLeftWidth: 5,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    textTransform: 'uppercase',
  },

  sectionStats: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },

  itemsList: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  cardHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },

  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },

  textDone: {
    color: '#C7C7CC',
    textDecorationLine: 'line-through',
  },

  readingsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 5,
  },

  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },

  readingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
});