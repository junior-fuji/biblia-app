import { getSupabaseOrThrow } from '@/lib/supabaseClient';

type SaveNoteInput = {
  title: string;
  reference?: string | null;
  content: string;
  userId?: string | null;
  client_id?: string | null;
};

export async function saveNote({
  title,
  reference,
  content,
  userId,
  client_id = null,
}: SaveNoteInput) {
  const supabase = getSupabaseOrThrow();

  let resolvedUserId = userId ?? null;

  if (!resolvedUserId) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('SAVE_NOTE_GET_SESSION_ERROR', sessionError);
      throw sessionError;
    }

    resolvedUserId = session?.user?.id ?? null;
  }

  if (!resolvedUserId) {
    return { error: 'NOT_AUTHENTICATED' as const };
  }

  const safeTitle = String(title || '').trim() || 'Sem Título';
  const safeReference = reference != null ? String(reference).trim() || null : null;
  const safeContent = String(content || '');

  const { data, error } = await supabase
    .from('saved_notes')
    .insert({
      title: safeTitle,
      reference: safeReference,
      content: safeContent,
      user_id: resolvedUserId,
      client_id,
    })
    .select('id, created_at, title, reference, content, user_id, client_id')
    .single();

  if (error) {
    console.log('SAVE_NOTE_INSERT_ERROR', error);
    throw error;
  }

  return {
    success: true as const,
    data,
  };
}