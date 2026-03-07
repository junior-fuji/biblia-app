import { cloudUpsertNote, localListNotes } from '@/lib/studiesStorage';
import { getSupabaseOrNull } from '@/lib/supabaseClient';

export async function syncLocalNotesToCloud() {
  const sb = getSupabaseOrNull();
  if (!sb) return;

  const { data } = await sb.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return;

  const localNotes = await localListNotes();

  for (const note of localNotes) {
    try {
      await cloudUpsertNote(note);
    } catch (err) {
      console.log('Erro ao sincronizar nota:', note.id);
    }
  }
}