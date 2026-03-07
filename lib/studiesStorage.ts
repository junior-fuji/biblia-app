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

async function getLocalNotes(): Promise<SavedNote[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function setLocalNotes(notes: SavedNote[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export async function saveLocalNote(note: SavedNote) {
  const notes = await getLocalNotes();
  notes.unshift(note);
  await setLocalNotes(notes);
}

export async function upsertNoteHybrid(note: SavedNote) {
  const sb = getSupabaseOrNull();

  try {
    if (sb) {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;

      if (user) {
        const { error } = await sb.from('saved_notes').insert({
          user_id: user.id,
          title: note.title,
          reference: note.reference ?? '',
          content: note.content,
        });

        if (!error) {
          return { mode: 'cloud' as const };
        }
      }
    }
  } catch (e) {
    console.log('Cloud save failed, fallback to local', e);
  }
await saveLocalNote(note);

await addToSyncQueue({
  type: 'note',
  payload: {
    title: note.title,
    reference: note.reference ?? '',
    content: note.content,
  },
});
  await saveLocalNote(note);
  await saveLocalNote(note);

  await addToSyncQueue({
    type: 'note',
    payload: {
      title: note.title,
      reference: note.reference ?? '',
      content: note.content,
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
  } catch {}

  return getLocalNotes();
}