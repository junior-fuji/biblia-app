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

function splitTextForProjection(
  text: string,
  options?: {
    maxChars?: number;
    maxLines?: number;
  },
): string[] {
  const maxChars = options?.maxChars ?? 210;
  const maxLines = options?.maxLines ?? 4;

  const normalized = String(text || '')
    .replace(/\r/g, '')
    .trim();

  if (!normalized) {
    return [];
  }

  const explicitLines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (explicitLines.length > 1) {
    const chunks: string[] = [];

    for (let index = 0; index < explicitLines.length; index += maxLines) {
      chunks.push(explicitLines.slice(index, index + maxLines).join('\n'));
    }

    return chunks;
  }

  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) {
        chunks.push(current);
      }

      current = word.length > maxChars ? word.slice(0, maxChars) : word;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
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
      const verseParts = splitTextForProjection(verseText, {
        maxLines: 4,
        maxChars: 210,
      });

      verseParts.forEach((part, partIndex) => {
        slides.push({
          id: `verse-${index + 1}-${partIndex + 1}`,
          title: '',
          content: part,
          kind: 'stanza',
        });
      });

      if (hasChorus) {
        const chorusParts = splitTextForProjection(chorus, {
          maxLines: 4,
          maxChars: 210,
        });

        chorusParts.forEach((part, partIndex) => {
          slides.push({
            id: `chorus-${index + 1}-${partIndex + 1}`,
            title: '',
            content: part,
            kind: 'chorus',
          });
        });
      }
    }
  }

  if (slides.length === 0 && hasChorus) {
    const chorusParts = splitTextForProjection(chorus, {
      maxLines: 4,
      maxChars: 210,
    });

    chorusParts.forEach((part, partIndex) => {
      slides.push({
        id: `chorus-only-${partIndex + 1}`,
        title: '',
        content: part,
        kind: 'chorus',
      });
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
      const match = slide.id.match(/chorus-(\d+)-(\d+)/);

      if (match?.[1] && match?.[2]) {
        return `Refrão ${match[1]} · parte ${match[2]}`;
      }

      return 'Refrão';
    }

    const match = slide.id.match(/verse-(\d+)-(\d+)/);

    if (match?.[1] && match?.[2]) {
      return `Estrofe ${match[1]} · parte ${match[2]}`;
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
        showTopHeader={false}
        showSlideHeader={false}
        showFooterCounter={false}
        showGroupNavigation={false}
        autoFitText={false}
        baseFontSize={38}
        minFontSize={30}
        maxFontSize={42}
      />
    );
  }

  return (
    <ProjectorScreen
      title={`${hymn.number} — ${hymn.title}`}
      subtitle="Harpa Cristã"
      slides={slides}
      onClose={handleClose}
      baseFontSize={38}
      uniformFontSize
      pickerLabel="Partes"
      pickerTitle={`${hymn.number} — ${hymn.title}`}
      renderSlideLabel={renderSlideLabel}
      showTopHeader={false}
      showSlideHeader={false}
      showFooterCounter={false}
      showGroupNavigation={false}
      autoFitText={false}
      minFontSize={30}
      maxFontSize={42}
    />
  );
}