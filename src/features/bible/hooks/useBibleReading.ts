import { getSupabaseOrThrow } from "@/lib/supabaseClient"; // ajuste se necessário
import { useEffect, useMemo, useState } from "react";
import { getVersionIdByCode } from "../api/bibleVersions.cache";
import { useBibleStore } from "../state/bibleStore";

type Verse = { book: number; chapter: number; verse: number; text: string };

export function useBibleReading(book: number, chapter: number) {
  const versionCode = useBibleStore((s) => s.versionCode);
  const setLastRead = useBibleStore((s) => s.setLastRead);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [verses, setVerses] = useState<Verse[]>([]);

  const key = useMemo(() => `${versionCode}:${book}:${chapter}`, [versionCode, book, chapter]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const supabase = await getSupabaseOrThrow();
        const versionId = await getVersionIdByCode(versionCode);

        const { data, error } = await supabase
          .from("bible_verses")
          .select("book, chapter, verse, text")
          .eq("version_id", versionId)
          .eq("book", book)
          .eq("chapter", chapter)
          .order("verse", { ascending: true });

        if (error) throw error;
        if (cancelled) return;

        setVerses((data ?? []) as Verse[]);
        setLastRead({ versionCode, book, chapter });
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [key, versionCode, book, chapter, setLastRead]);

  return { loading, error, verses, versionCode };
}