import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Router } from 'expo-router';
import { Platform } from 'react-native';

export type ProjectorSlideKind =
  | 'verse'
  | 'bible-verse'
  | 'event'
  | 'sketch'
  | 'custom'
  | 'blank';

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
    part?: number;
    totalParts?: number;
    [key: string]: unknown;
  };
};

export type Verse = {
  id?: number | string;
  verse: number;
  text: string;
};

export type StoredProjectorPayload = {
  title: string;
  subtitle?: string;
  slides: ProjectorSlide[];
};

export const PROJECTOR_STORAGE_KEY = 'BIBLE_PROJECTOR_SLIDES_V1';

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

function createDeckId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getProjectorStorageKey(deckId: string): string {
  return `${PROJECTOR_STORAGE_KEY}:${deckId}`;
}

async function setProjectorStorageItem(key: string, value: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
}

export async function getProjectorStorageItem(
  key: string,
): Promise<string | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem(key);
  }

  return AsyncStorage.getItem(key);
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

function splitTextForProjection(
  text: string,
  options?: {
    maxChars?: number;
    maxLines?: number;
  },
): string[] {
  const maxChars = options?.maxChars ?? 230;
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

  const verseSlides: ProjectorSlide[] = validVerses.flatMap((verse) => {
    const reference = `${cleanBookLabel} ${chapter}:${verse.verse}`;

    const parts = splitTextForProjection(verse.text, {
      maxChars: 230,
      maxLines: 4,
    });

    return parts.map((part, index) => {
      const hasMultipleParts = parts.length > 1;
      const displayTitle = hasMultipleParts
        ? `${reference} · ${index + 1}/${parts.length}`
        : reference;

      return {
        id: `bible-${safeBookId}-${chapter}-${verse.verse}-${index + 1}`,
        title: displayTitle,
        content: part,
        kind: 'bible-verse',
        reference: displayTitle,
        verseNumber: verse.verse,
        meta: {
          bookLabel: cleanBookLabel,
          chapter,
          verse: verse.verse,
          part: index + 1,
          totalParts: parts.length,
        },
      };
    });
  });

  return verseSlides;
}

export async function saveBibleProjectorPayload(params: {
  bookLabel: string;
  chapter: number;
  verses: Verse[];
}): Promise<string> {
  const slides = buildBibleSlides(
    params.bookLabel,
    params.chapter,
    params.verses,
  );

  const deckId = createDeckId();

  const payload: StoredProjectorPayload = {
    title: `${params.bookLabel} ${params.chapter}`,
    subtitle: 'Projetor Bíblico',
    slides,
  };

  await setProjectorStorageItem(
    getProjectorStorageKey(deckId),
    JSON.stringify(payload),
  );

  return deckId;
}

export async function loadBibleProjectorPayload(
  deckId: string,
): Promise<StoredProjectorPayload | null> {
  const raw = await getProjectorStorageItem(getProjectorStorageKey(deckId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredProjectorPayload;

    if (!parsed || !Array.isArray(parsed.slides)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function openBibleProjector(params: {
  router: Router;
  bookLabel: string;
  chapter: number;
  verses: Verse[];
}) {
  const deckId = await saveBibleProjectorPayload({
    bookLabel: params.bookLabel,
    chapter: params.chapter,
    verses: params.verses,
  });

  const href = `/projector/bible?deckId=${encodeURIComponent(deckId)}`;

  params.router.push(href as never);
}