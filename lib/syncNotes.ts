import { getSupabaseOrNull } from '@/lib/supabaseClient';

const ENABLE_LOCAL_NOTES_CLOUD_SYNC = false;

export async function syncLocalNotesToCloud() {
  if (!ENABLE_LOCAL_NOTES_CLOUD_SYNC) {
    console.log('SYNC_LOCAL_NOTES_TO_CLOUD_DISABLED');
    return {
      processed: 0,
      skipped: true,
    };
  }

  const sb = getSupabaseOrNull();
  if (!sb) {
    return {
      processed: 0,
      skipped: true,
    };
  }

  const { data, error } = await sb.auth.getSession();
  if (error) {
    console.log('SYNC_LOCAL_NOTES_SESSION_ERROR', error);
    return {
      processed: 0,
      skipped: true,
    };
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    return {
      processed: 0,
      skipped: true,
    };
  }

  return {
    processed: 0,
    skipped: true,
  };
}