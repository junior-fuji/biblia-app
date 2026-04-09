import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseOrNull } from './supabaseClient';

const STORAGE_KEY = 'LOCAL_STUDIES';
const ENABLE_LOCAL_STUDIES_SYNC = false;

export async function syncLocalStudies() {
  if (!ENABLE_LOCAL_STUDIES_SYNC) {
    console.log('SYNC_LOCAL_STUDIES_DISABLED');
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

  try {
    const { data, error: sessionError } = await sb.auth.getSession();
    if (sessionError) {
      console.log('SYNC_LOCAL_STUDIES_SESSION_ERROR', sessionError);
      return {
        processed: 0,
        skipped: true,
      };
    }

    const user = data.session?.user;
    if (!user) {
      return {
        processed: 0,
        skipped: true,
      };
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        processed: 0,
        skipped: true,
      };
    }

    let localNotes: any[] = [];
    try {
      const parsed = JSON.parse(raw);
      localNotes = Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.log('SYNC_LOCAL_STUDIES_PARSE_ERROR', parseError);
      return {
        processed: 0,
        skipped: true,
      };
    }

    if (!localNotes.length) {
      return {
        processed: 0,
        skipped: true,
      };
    }

    // Sincronização intencionalmente desativada durante estabilização.
    return {
      processed: 0,
      skipped: true,
    };
  } catch (e) {
    console.log('SYNC_LOCAL_STUDIES_FATAL', e);
    return {
      processed: 0,
      skipped: true,
    };
  }
}

export async function clearLocalStudiesCache() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}