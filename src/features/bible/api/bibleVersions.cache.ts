// src/features/bible/api/bibleVersions.cache.ts
import { getSupabaseOrNull } from "@/lib/supabaseClient";
import { Platform } from "react-native";

export type BibleVersion = {
  id: string;
  code: string;
  name: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const CACHE_KEY = "bibleapp:bible_versions:v2";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas

type CachePayload = {
  savedAt: number;
  data: BibleVersion[];
};

async function getStorage() {
  if (Platform.OS === "web") {
    return {
      getItem: async (k: string) => localStorage.getItem(k),
      setItem: async (k: string, v: string) => localStorage.setItem(k, v),
      removeItem: async (k: string) => localStorage.removeItem(k),
    };
  }
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  return {
    getItem: async (k: string) => AsyncStorage.getItem(k),
    setItem: async (k: string, v: string) => AsyncStorage.setItem(k, v),
    removeItem: async (k: string) => AsyncStorage.removeItem(k),
  };
}

export async function invalidateBibleVersionsCache() {
  const storage = await getStorage();
  await storage.removeItem(CACHE_KEY);
}

async function readCache(): Promise<BibleVersion[] | null> {
  const storage = await getStorage();
  const raw = await storage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed: CachePayload = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed?.data)) return null;

    const fresh = Date.now() - parsed.savedAt <= CACHE_TTL_MS;
    if (!fresh) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache(data: BibleVersion[]) {
  const storage = await getStorage();
  const payload: CachePayload = { savedAt: Date.now(), data };
  await storage.setItem(CACHE_KEY, JSON.stringify(payload));
}

/**
 * Regra de produto:
 * - se a rede falhar, pode retornar cache antigo
 * - mas NUNCA persistir fallback (tipo só ARA), senão “gruda” em produção
 */
export async function getBibleVersionsCached(): Promise<BibleVersion[]> {
  const cached = await readCache();

  const sb = getSupabaseOrNull();
  if (!sb) {
    // sem supabase no build -> devolve cache se tiver, senão fallback (não cacheia)
    return cached ?? [{ id: "local-ara", code: "ARA", name: "ARA", sort_order: 1, is_active: true }];
  }

  const { data, error } = await sb
    .from("bible_versions")
    .select("id, code, name, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    // falhou rede/rls/env -> devolve cache se tiver; senão fallback (não cacheia)
    return cached ?? [{ id: "local-ara", code: "ARA", name: "ARA", sort_order: 1, is_active: true }];
  }

  const safe = (data ?? []).filter((v) => v?.id && v?.code);
  if (safe.length > 0) {
    await writeCache(safe);
    return safe;
  }

  // sem versões no banco (estranho) -> devolve cache ou fallback (não cacheia)
  return cached ?? [{ id: "local-ara", code: "ARA", name: "ARA", sort_order: 1, is_active: true }];
}