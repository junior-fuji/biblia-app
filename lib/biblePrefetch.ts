// lib/biblePrefetch.ts
import { cacheChapter, getCachedChapter } from '@/lib/bibleCache';
import { getSupabaseOrNull } from '@/lib/supabaseClient';

type Verse = { id: number; verse: number; text: string };

// cache local em memória p/ evitar disparar prefetch repetido em sequência
const inFlight = new Set<string>();

function key(versionCode: string, bookId: number, chapter: number) {
  return `${versionCode}:${bookId}:${chapter}`;
}

export async function prefetchChapter(opts: {
  versionCode: string;
  versionId: string;
  bookId: number;
  chapterNum: number;
}) {
  const { versionCode, versionId, bookId, chapterNum } = opts;

  if (chapterNum <= 0) return;

  const k = key(versionCode, bookId, chapterNum);
  if (inFlight.has(k)) return;

  // já tem no cache? não faz nada
  const cached = await getCachedChapter(versionCode, bookId, chapterNum);
  if (cached && cached.length) return;

  const sb = getSupabaseOrNull();
  if (!sb) return;

  inFlight.add(k);
  try {
    const { data, error } = await sb
      .from('bible_verses')
      .select('id, verse, text')
      .eq('version_id', versionId)
      .eq('book', bookId)
      .eq('chapter', chapterNum)
      .order('verse', { ascending: true });

    if (error) return;

    const verses = (data ?? []) as Verse[];
    if (verses.length) {
      await cacheChapter(versionCode, bookId, chapterNum, verses);
    }
  } finally {
    inFlight.delete(k);
  }
}

export async function prefetchAdjacentChapters(opts: {
  versionCode: string;
  versionId: string;
  bookId: number;
  chapterNum: number;
  totalChapters: number;
}) {
  const { versionCode, versionId, bookId, chapterNum, totalChapters } = opts;

  const prev = chapterNum - 1;
  const next = chapterNum + 1;

  // dispara em paralelo, silencioso
  const tasks: Promise<any>[] = [];

  if (prev >= 1) {
    tasks.push(prefetchChapter({ versionCode, versionId, bookId, chapterNum: prev }));
  }
  if (totalChapters > 0 && next <= totalChapters) {
    tasks.push(prefetchChapter({ versionCode, versionId, bookId, chapterNum: next }));
  }

  await Promise.allSettled(tasks);
}