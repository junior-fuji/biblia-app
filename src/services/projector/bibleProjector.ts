import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Router } from 'expo-router';

export type ProjectorSlideKind =
  | 'verse'
  | 'bible-title'
  | 'bible-verse';

export type ProjectorSlide = {
  id: string;
  title: string;
  content: string;
  kind: ProjectorSlideKind;
  reference?: string;
  verseNumber?: number;
  meta?: {
    bookLabel?: string;
    chapter?: number;
    verse?: number;
    [key: string]: unknown;
  };
};

export type Verse = {
  id?: number | string;
  verse: number;
  text: string;
};

type StoredProjectorPayload = {
  title: string;
  subtitle?: string;
  slides: ProjectorSlide[];
};

const PROJECTOR_STORAGE_KEY = 'BIBLE_PROJECTOR_SLIDES_V1';

function normalizeText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function validateBibleSlidesInput(
  bookLabel: string,
  chapter: number,
  verses: Verse[],
) {
  if (!bookLabel || !bookLabel.trim()) {
    throw new Error('Livro inválido para o projetor.');
  }

  if (!Number.isFinite(chapter) || chapter <= 0) {
    throw new Error('Capítulo inválido para o projetor.');
  }

  if (!Array.isArray(verses) || verses.length === 0) {
    throw new Error('Nenhum versículo carregado para projetar.');
  }
}

export function buildBibleSlides(
  bookLabel: string,
  chapter: number,
  verses: Verse[],
): ProjectorSlide[] {
  validateBibleSlidesInput(bookLabel, chapter, verses);

  const cleanBookLabel = bookLabel.trim();
  const safeBookId = normalizeIdPart(cleanBookLabel);

  const validVerses = verses
    .map((verse) => ({
      ...verse,
      verse: Number(verse.verse),
      text: normalizeText(verse.text),
    }))
    .filter(
      (verse) =>
        Number.isFinite(verse.verse) &&
        verse.verse > 0 &&
        verse.text.length > 0,
    )
    .sort((a, b) => a.verse - b.verse);

  if (validVerses.length === 0) {
    throw new Error('Nenhum versículo válido encontrado para projetar.');
  }

  const titleSlide: ProjectorSlide = {
    id: `bible-${safeBookId}-${chapter}-title`,
    title: `${cleanBookLabel} ${chapter}`,
    content: `${cleanBookLabel} ${chapter}`,
    kind: 'bible-title',
    reference: `${cleanBookLabel} ${chapter}`,
    meta: {
      bookLabel: cleanBookLabel,
      chapter,
    },
  };

  const verseSlides: ProjectorSlide[] = validVerses.map((verse) => {
    const reference = `${cleanBookLabel} ${chapter}:${verse.verse}`;

    return {
      id: `bible-${safeBookId}-${chapter}-${verse.verse}`,
      title: reference,
      content: verse.text,
      kind: 'bible-verse',
      reference,
      verseNumber: verse.verse,
      meta: {
        bookLabel: cleanBookLabel,
        chapter,
        verse: verse.verse,
      },
    };
  });

  return [titleSlide, ...verseSlides];
}

export async function openBibleProjector(params: {
  router: Router;
  bookLabel: string;
  chapter: number;
  verses: Verse[];
}) {
  const slides = buildBibleSlides(
    params.bookLabel,
    params.chapter,
    params.verses,
  );

  const deckId = `${Date.now()}`;

  const payload: StoredProjectorPayload = {
    title: `${params.bookLabel} ${params.chapter}`,
    subtitle: 'Projetor Bíblico',
    slides,
  };

  await AsyncStorage.setItem(
    `${PROJECTOR_STORAGE_KEY}:${deckId}`,
    JSON.stringify(payload),
  );

  params.router.push({
    pathname: '/projector/bible' as never,
    params: {
      deckId,
    },
  });
}