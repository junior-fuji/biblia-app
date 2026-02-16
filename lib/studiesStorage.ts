// lib/studiesStorage.ts
import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = getSupabaseOrThrow();

export type SavedNote = {
  id: string;              // local: uuid string; supabase: bigint/uuid como string
  title: string;
  content: string;
  created_at: string;      // ISO string
  updated_at?: string;     // ISO string
  user_id?: string | null; // supabase (futuro)
};

const LOCAL_KEY = 'bibleApp:saved_notes:v1';

function nowISO() {
  return new Date().toISOString();
}

// Converte id vindo do Supabase (bigint number/string) para string
function normalizeId(v: any): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (v == null) return String(Date.now());
  return String(v);
}

// Quando ENV não existe, supabase pode ser null. Guard seguro:
function getSupabaseOrNull() {
  return supabase ?? null;
}

async function getSessionUserIdSafe(): Promise<string | null> {
  const sb = getSupabaseOrNull();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// -------------------------
// Local (AsyncStorage)
// -------------------------
export async function localListNotes(): Promise<SavedNote[]> {
  const raw = await AsyncStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedNote[]) : [];
  } catch {
    return [];
  }
}

async function localSaveAll(notes: SavedNote[]) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
}

export async function localUpsertNote(note: SavedNote): Promise<SavedNote> {
  const notes = await localListNotes();
  const idx = notes.findIndex((n) => n.id === note.id);

  const updated: SavedNote = {
    ...note,
    id: normalizeId(note.id),
    updated_at: nowISO(),
    created_at: note.created_at || nowISO(),
  };

  if (idx >= 0) notes[idx] = updated;
  else notes.unshift(updated);

  await localSaveAll(notes);
  return updated;
}

export async function localDeleteNote(id: string): Promise<void> {
  const notes = await localListNotes();
  const next = notes.filter((n) => n.id !== id);
  await localSaveAll(next);
}

// -------------------------
// Supabase (só se ENV + sessão)
// -------------------------
export async function cloudListNotes(): Promise<SavedNote[]> {
  const sb = getSupabaseOrNull();
  if (!sb) return [];

  const userId = await getSessionUserIdSafe();
  if (!userId) return [];

  // Sua tabela atual tem: id(bigint), created_at, title, reference, content
  // Então selecionamos apenas as colunas existentes.
  const { data, error } = await sb
    .from('saved_notes')
    .select('id,title,content,created_at,reference')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Mapeia para o shape do app (reference não está no type, mas você pode incluir se quiser)
  return (data ?? []).map((r: any) => ({
    id: normalizeId(r.id),
    title: String(r.title ?? ''),
    content: String(r.content ?? ''),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : nowISO(),
    // updated_at e user_id não existem na tabela atual
  })) as SavedNote[];
}

export async function cloudUpsertNote(note: SavedNote): Promise<SavedNote> {
  const sb = getSupabaseOrNull();
  if (!sb) throw new Error('Supabase não configurado (ENV ausente).');

  const userId = await getSessionUserIdSafe();
  if (!userId) throw new Error('Sem sessão: não pode salvar no Supabase.');

  // Sua tabela atual NÃO tem user_id/updated_at. Não envie campos que não existem.
  const payload: any = {
    id: Number.isFinite(Number(note.id)) ? Number(note.id) : undefined, // opcional; se quiser deixar o DB gerar, remova id
    title: note.title,
    content: note.content,
    created_at: note.created_at || nowISO(),
    // reference: ... (se você quiser salvar reference, precisa passar aqui e existir no note)
  };

  // Se id não for numérico, não envie (deixa o banco gerar)
  if (payload.id === undefined) delete payload.id;

  const { data, error } = await sb
    .from('saved_notes')
    .upsert(payload)
    .select('id,title,content,created_at,reference')
    .single();

  if (error) throw error;

  return {
    id: normalizeId((data as any)?.id),
    title: String((data as any)?.title ?? ''),
    content: String((data as any)?.content ?? ''),
    created_at: (data as any)?.created_at ? new Date((data as any).created_at).toISOString() : nowISO(),
  };
}

export async function cloudDeleteNote(id: string): Promise<void> {
  const sb = getSupabaseOrNull();
  if (!sb) throw new Error('Supabase não configurado (ENV ausente).');

  const userId = await getSessionUserIdSafe();
  if (!userId) throw new Error('Sem sessão: não pode excluir no Supabase.');

  // id bigint -> precisa ser number ou string numérica
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error('ID inválido para exclusão no Supabase.');

  const { error } = await sb.from('saved_notes').delete().eq('id', numericId);
  if (error) throw error;
}

// -------------------------
// Hybrid API (a que a tela usa)
// -------------------------
export async function listNotesHybrid(): Promise<{ mode: 'cloud' | 'local'; notes: SavedNote[] }> {
  const sb = getSupabaseOrNull();
  const userId = sb ? await getSessionUserIdSafe() : null;

  if (sb && userId) {
    const notes = await cloudListNotes();
    return { mode: 'cloud', notes };
  }

  const notes = await localListNotes();
  return { mode: 'local', notes };
}

export async function upsertNoteHybrid(note: SavedNote): Promise<{ mode: 'cloud' | 'local'; note: SavedNote }> {
  const sb = getSupabaseOrNull();
  const userId = sb ? await getSessionUserIdSafe() : null;

  if (sb && userId) {
    const saved = await cloudUpsertNote(note);
    return { mode: 'cloud', note: saved };
  }

  const saved = await localUpsertNote(note);
  return { mode: 'local', note: saved };
}

export async function deleteNoteHybrid(id: string): Promise<{ mode: 'cloud' | 'local' }> {
  const sb = getSupabaseOrNull();
  const userId = sb ? await getSessionUserIdSafe() : null;

  if (sb && userId) {
    await cloudDeleteNote(id);
    return { mode: 'cloud' };
  }

  await localDeleteNote(id);
  return { mode: 'local' };
}
