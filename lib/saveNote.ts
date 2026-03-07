import { getSupabaseOrThrow } from '@/lib/supabaseClient';

export async function saveNote({
  title,
  reference,
  content,
}: {
  title: string;
  reference?: string;
  content: string;
}) {
  const supabase = getSupabaseOrThrow();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: 'NOT_AUTHENTICATED' };
  }

  const { error } = await supabase.from('saved_notes').insert({
    title,
    reference,
    content,
    user_id: session.user.id,
  });

  if (error) throw error;

  return { success: true };
}