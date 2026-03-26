import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseOrNull } from './supabaseClient';
import { addToSyncQueue } from './syncQueue';

export type SavedNote = {
  id: string;
  title: string;
  reference?: string;
  content: string;
  created_at: string;
};

const STORAGE_KEY = 'LOCAL_STUDIES';

function normalizeNote(note: SavedNote): SavedNote {
  return {
    id: String(note.id),
    title: String(note.title ?? 'Sem Título'),
    reference: note.reference != null ? String(note.reference) : '',
    content: String(note.content ?? ''),
    created_at: note.created_at || new Date().toISOString(),
  };
}

function sortNotesDesc(notes: SavedNote[]): SavedNote[] {
  return [...notes].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return tb - ta;
  });
}

async function getLocalNotes(): Promise<SavedNote[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortNotesDesc(parsed.map(normalizeNote));
  } catch {
    return [];
  }
}

async function setLocalNotes(notes: SavedNote[]) {
  const normalized = sortNotesDesc(notes.map(normalizeNote));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export async function saveLocalNote(note: SavedNote) {
  const normalized = normalizeNote(note);
  const notes = await getLocalNotes();

  const next = [
    normalized,
    ...notes.filter((item) => String(item.id) !== String(normalized.id)),
  ];

  await setLocalNotes(next);
  return normalized;
}

export async function updateLocalNote(
  noteId: string,
  patch: Partial<Omit<SavedNote, 'id' | 'created_at'>> & { created_at?: string }
) {
  const notes = await getLocalNotes();
  const current = notes.find((item) => String(item.id) === String(noteId));

  if (!current) {
    throw new Error('Estudo não encontrado para atualização.');
  }

  const updated: SavedNote = normalizeNote({
    ...current,
    ...patch,
    id: current.id,
    created_at: patch.created_at ?? current.created_at,
  });

  const next = notes.map((item) =>
    String(item.id) === String(noteId) ? updated : item
  );

  await setLocalNotes(next);
  return updated;
}

export async function deleteLocalNote(noteId: string) {
  const notes = await getLocalNotes();
  const next = notes.filter((item) => String(item.id) !== String(noteId));
  await setLocalNotes(next);
  return next;
}

export async function getLocalNoteById(noteId: string): Promise<SavedNote | null> {
  const notes = await getLocalNotes();
  return notes.find((item) => String(item.id) === String(noteId)) ?? null;
}

export async function replaceAllLocalNotes(notes: SavedNote[]) {
  await setLocalNotes(notes);
}

export async function clearAllLocalNotes() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function upsertNoteHybrid(note: SavedNote) {
  const normalized = normalizeNote(note);
  const sb = getSupabaseOrNull();

  try {
    if (sb) {
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();

      if (sessionError) {
        console.log('GET_SESSION_ERROR', sessionError);
      }

      const user = sessionData.session?.user;

      if (user) {
        const { error } = await sb.from('saved_notes').insert({
          user_id: user.id,
          title: normalized.title,
          reference: normalized.reference ?? '',
          content: normalized.content,
          created_at: normalized.created_at,
        });

        if (!error) {
          return { mode: 'cloud' as const };
        }

        console.log('SAVE_NOTE_CLOUD_ERROR', error);
      }
    }
  } catch (e) {
    console.log('CLOUD_SAVE_FAILED_FALLBACK_LOCAL', e);
  }

  await saveLocalNote(normalized);

  try {
    await addToSyncQueue({
      type: 'note',
      payload: {
        id: normalized.id,
        title: normalized.title,
        reference: normalized.reference ?? '',
        content: normalized.content,
        created_at: normalized.created_at,
      },
    });
  } catch (e) {
    console.log('ADD_TO_SYNC_QUEUE_ERROR', e);
  }

  return { mode: 'local' as const };
}

export async function getAllNotes(): Promise<SavedNote[]> {
  const sb = getSupabaseOrNull();

  try {
    if (sb) {
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();

      if (sessionError) {
        console.log('GET_SESSION_ERROR', sessionError);
      }

      const user = sessionData.session?.user;

      if (user) {
        const { data: notes, error } = await sb
          .from('saved_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('GET_ALL_NOTES_CLOUD_ERROR', error);
        } else if (notes) {
          return sortNotesDesc((notes as SavedNote[]).map(normalizeNote));
        }
      }
    }
  } catch (e) {
    console.log('GET_ALL_NOTES_FALLBACK_LOCAL', e);
  }

  return getLocalNotes();
}