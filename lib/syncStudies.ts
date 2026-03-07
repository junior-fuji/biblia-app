import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseOrNull } from './supabaseClient';

const STORAGE_KEY = 'LOCAL_STUDIES';

export async function syncLocalStudies() {
  const sb = getSupabaseOrNull();
  if (!sb) return;

  try {
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;

    if (!user) return;

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const localNotes = JSON.parse(raw);
    if (!localNotes.length) return;

    // 🔎 buscar estudos já existentes na nuvem
    const { data: cloudNotes } = await sb
      .from('saved_notes')
      .select('title, reference, content')
      .eq('user_id', user.id);

    const existing = new Set(
      (cloudNotes || []).map(
        (n: any) => `${n.title}|${n.reference}|${n.content}`
      )
    );

    // 🔹 filtra apenas novos
    const notesToInsert = localNotes.filter((note: any) => {
      const key = `${note.title}|${note.reference}|${note.content}`;
      return !existing.has(key);
    });

    if (!notesToInsert.length) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }

    const payload = notesToInsert.map((note: any) => ({
      user_id: user.id,
      title: note.title,
      reference: note.reference ?? '',
      content: note.content,
    }));

    const { error } = await sb.from('saved_notes').insert(payload);

    if (error) {
      console.log('SYNC_ERROR', error);
      return;
    }

    // limpa cache local
    await AsyncStorage.removeItem(STORAGE_KEY);

    console.log('SYNC_SUCCESS');
  } catch (e) {
    console.log('SYNC_FATAL', e);
  }
}