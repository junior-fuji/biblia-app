import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseOrNull } from './supabaseClient';
import { addToSyncQueue } from './syncQueue';

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
  } catch {
    return [];
  }
}

async function setLocalNotes(notes: SavedNote[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export async function saveLocalNote(note: SavedNote) {
  const notes = await getLocalNotes();

  const exists = notes.some((n) => n.client_id === note.client_id);
  if (!exists) {
    notes.unshift(note);
    await setLocalNotes(notes);
  }
}

export async function upsertNoteHybrid(note: Omit<SavedNote, 'client_id'>) {
  const sb = getSupabaseOrNull();

  const client_id = generateClientId();

  const normalized: SavedNote = {
    ...note,
    client_id,
    created_at: note.created_at || new Date().toISOString(),
  };

  try {
    if (sb) {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;

      if (user) {
        const { error } = await sb
          .from('saved_notes')
          .upsert(
            {
              user_id: user.id,
              client_id: normalized.client_id,
              title: normalized.title,
              reference: normalized.reference ?? '',
              content: normalized.content,
              created_at: normalized.created_at,
            },
            { onConflict: 'client_id' }
          );

        if (!error) {
          return { mode: 'cloud' as const };
        }

        console.log('UPSERT_CLOUD_ERROR', error);
      }
    }
  } catch (e) {
    console.log('Cloud save failed, fallback to local', e);
  }

  // fallback offline
  await saveLocalNote(normalized);

  await addToSyncQueue({
    type: 'note',
    payload: {
      client_id: normalized.client_id,
      title: normalized.title,
      reference: normalized.reference ?? '',
      content: normalized.content,
      created_at: normalized.created_at,
    },
  });

  return { mode: 'local' as const };
}

export async function getAllNotes(): Promise<SavedNote[]> {
  const sb = getSupabaseOrNull();

  try {
    if (sb) {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;

      if (user) {
        const { data: notes } = await sb
          .from('saved_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notes) return notes as SavedNote[];
      }
    }
  } catch (e) {
    console.log('GET_NOTES_ERROR', e);
  }

  return getLocalNotes();
}