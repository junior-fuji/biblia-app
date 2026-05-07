import ProjectorScreen, {
  ProjectorSlide,
} from '@/src/services/projector/ProjectorScreen';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';

const HARPA = require('../../../assets/harpa_clean.json');

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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

function normalizeText(text?: string) {
  return String(text ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function buildSlides(hymn: HarpaSong): ProjectorSlide[] {
  const slides: ProjectorSlide[] = [];
  const verses = Array.isArray(hymn.verses) ? hymn.verses : [];
  const chorus = normalizeText(hymn.coro);
  const hasChorus = chorus.length > 0;

  for (let index = 0; index < verses.length; index += 1) {
    const verse = verses[index];
    const verseText = normalizeText(verse?.text);

    if (verseText) {
      slides.push({
        id: `verse-${index + 1}`,
        title: '',
        content: verseText,
        kind: 'stanza',
      });

      if (hasChorus) {
        slides.push({
          id: `chorus-${index + 1}`,
          title: '',
          content: chorus,
          kind: 'chorus',
        });
      }
    }
  }

  if (slides.length === 0 && hasChorus) {
    slides.push({
      id: 'chorus-only',
      title: '',
      content: chorus,
      kind: 'chorus',
    });
  }

  return slides;
}

export default function HarpaProjectorScreen() {
  useKeepAwake();

  const router = useRouter();
  const { number } = useLocalSearchParams<{ number?: string }>();

  const isWeb = Platform.OS === 'web';
  const currentNumber = useMemo(
    () => clamp(Number(number) || 1, 1, 640),
    [number],
  );

  useEffect(() => {
    if (!isWeb) {
      router.replace(`/harpa/${currentNumber}` as never);
    }
  }, [currentNumber, isWeb, router]);

  const hymn = useMemo<HarpaSong | undefined>(() => {
    const songs = Array.isArray(HARPA) ? (HARPA as HarpaSong[]) : [];
    return songs.find((h) => h.number === currentNumber);
  }, [currentNumber]);

  const slides = useMemo<ProjectorSlide[]>(() => {
    if (!hymn) return [];
    return buildSlides(hymn);
  }, [hymn]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const renderSlideLabel = useCallback((slide: ProjectorSlide) => {
    if (slide.kind === 'chorus') {
      return 'Refrão';
    }

    const match = slide.id.match(/verse-(\d+)/);

    if (match?.[1]) {
      return `Estrofe ${match[1]}`;
    }

    return 'Slide';
  }, []);

  if (!isWeb) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!hymn) {
    return (
      <ProjectorScreen
        title="Harpa Cristã"
        subtitle="Hino não encontrado"
        slides={[]}
        onClose={handleClose}
        pickerLabel="Partes"
        pickerTitle="Selecionar parte"
        showHeaderLabels={false}
        showFooterCounter={false}
        showGroupNavigation={false}
        autoFitText
        minFontSize={8}
        maxFontSize={76}
      />
    );
  }

  return (
    <ProjectorScreen
      title={`${hymn.number} — ${hymn.title}`}
      subtitle="Harpa Cristã"
      slides={slides}
      onClose={handleClose}
      baseFontSize={42}
      uniformFontSize
      pickerLabel="Partes"
      pickerTitle={`${hymn.number} — ${hymn.title}`}
      renderSlideLabel={renderSlideLabel}
      showHeaderLabels={false}
      showFooterCounter={false}
      showGroupNavigation={false}
      autoFitText
      minFontSize={8}
      maxFontSize={82}
    />
  );
}