import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseOrNull } from './supabaseClient';

export type SavedNote = {
  id: string;
  client_id: string;
  title: string;
  reference?: string;
  content: string;
  created_at: string;
};

const STORAGE_KEY = 'LOCAL_STUDIES';

function generateClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function getLocalNotes(): Promise<SavedNote[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log('GET_LOCAL_NOTES_PARSE_ERROR', error);
    return [];
  }
}

async function setLocalNotes(notes: SavedNote[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export async function localListNotes(): Promise<SavedNote[]> {
  const notes = await getLocalNotes();
  return [...notes].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return tb - ta;
  });
}

export async function saveLocalNote(note: SavedNote) {
  const notes = await getLocalNotes();

  const exists = notes.some((n) => n.client_id === note.client_id);
  if (!exists) {
    notes.unshift(note);
    await setLocalNotes(notes);
  }
}

export async function cloudUpsertNote(note: SavedNote) {
  const sb = getSupabaseOrNull();
  if (!sb) {
    throw new Error('Supabase não configurado.');
  }

  const { data, error: sessionError } = await sb.auth.getSession();
  if (sessionError) {
    console.log('CLOUD_UPSERT_NOTE_SESSION_ERROR', sessionError);
    throw sessionError;
  }

  const user = data.session?.user;
  if (!user) {
    throw new Error('NOT_AUTHENTICATED');
  }

  // Não enviar id manualmente. Não usar upsert por client_id por enquanto.
  const payload = {
    user_id: user.id,
    title: String(note.title ?? '').trim() || 'Sem Título',
    reference: note.reference != null ? String(note.reference) : '',
    content: String(note.content ?? ''),
    client_id: note.client_id ? String(note.client_id) : null,
  };

  const { data: inserted, error } = await sb
    .from('saved_notes')
    .insert(payload)
    .select('id, client_id, title, reference, content, created_at')
    .single();

  if (error) {
    console.log('CLOUD_UPSERT_NOTE_ERROR', error);
    throw error;
  }

  return inserted;
}

export async function upsertNoteHybrid(note: Omit<SavedNote, 'client_id'>) {
  const sb = getSupabaseOrNull();

  const normalized: SavedNote = {
    ...note,
    client_id: generateClientId(),
    created_at: note.created_at || new Date().toISOString(),
  };

  try {
    if (sb) {
      const { data, error: sessionError } = await sb.auth.getSession();
      if (sessionError) {
        console.log('UPSERT_NOTE_HYBRID_SESSION_ERROR', sessionError);
      } else {
        const user = data.session?.user;

        // Usuário logado: Supabase é a única fonte de verdade
        if (user) {
          const payload = {
            user_id: user.id,
            title: String(normalized.title ?? '').trim() || 'Sem Título',
            reference: normalized.reference != null ? String(normalized.reference) : '',
            content: String(normalized.content ?? ''),
            client_id: normalized.client_id,
          };

          const { error } = await sb
            .from('saved_notes')
            .insert(payload);

          if (!error) {
            return { mode: 'cloud' as const };
          }

          console.log('UPSERT_CLOUD_ERROR', error);
          throw error;
        }
      }
    }
  } catch (e) {
    console.log('UPSERT_NOTE_HYBRID_CLOUD_FATAL', e);
  }

  // Sem usuário logado: salva apenas local.
  await saveLocalNote(normalized);
  return { mode: 'local' as const };
}

export async function getAllNotes(): Promise<SavedNote[]> {
  const sb = getSupabaseOrNull();

  try {
    if (sb) {
      const { data, error: sessionError } = await sb.auth.getSession();
      if (sessionError) {
        console.log('GET_ALL_NOTES_SESSION_ERROR', sessionError);
      } else {
        const user = data.session?.user;

        // Usuário logado: somente remoto
        if (user) {
          const { data: notes, error } = await sb
            .from('saved_notes')
            .select('id, client_id, title, reference, content, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.log('GET_REMOTE_NOTES_ERROR', error);
            return [];
          }

          return (notes ?? []) as SavedNote[];
        }
      }
    }
  } catch (e) {
    console.log('GET_NOTES_ERROR', e);
    return [];
  }

  // Sem usuário logado: somente local
  return localListNotes();
}