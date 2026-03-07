import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'BIBLE_CACHE';

export type CachedVerse = {
  id: number;
  verse: number;
  text: string;
};

function makeKey(version: string, book: number, chapter: number) {
  return `${CACHE_PREFIX}_${version}_${book}_${chapter}`;
}

export async function getCachedChapter(
  version: string,
  book: number,
  chapter: number
): Promise<CachedVerse[] | null> {
  try {
    const key = makeKey(version, book, chapter);
    const raw = await AsyncStorage.getItem(key);

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export async function preloadChapter(
    version: string,
    book: number,
    chapter: number,
    fetcher: () => Promise<any[]>
  ) {
    const cached = await getCachedChapter(version, book, chapter);
  
    if (cached) return;
  
    try {
      const verses = await fetcher();
  
      if (verses?.length) {
        await cacheChapter(version, book, chapter, verses);
      }
    } catch {}
  }
export async function cacheChapter(
  version: string,
  book: number,
  chapter: number,
  verses: CachedVerse[]
) {
  try {
    const key = makeKey(version, book, chapter);
    await AsyncStorage.setItem(key, JSON.stringify(verses));
  } catch {}
}