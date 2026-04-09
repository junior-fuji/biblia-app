import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type Session, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extra.supabaseUrl;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  extra.supabaseAnonKey;

let _client: SupabaseClient | null = null;
let _appStateSubscribed = false;

function createSupabaseInstance(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase não configurado. Faltam ENV: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });

  if (Platform.OS !== 'web' && !_appStateSubscribed) {
    _appStateSubscribed = true;

    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });
  }

  return client;
}

if (supabaseUrl && supabaseAnonKey) {
  _client = createSupabaseInstance();
}

export function getSupabaseOrThrow(): SupabaseClient {
  if (!_client) {
    _client = createSupabaseInstance();
  }
  return _client;
}

export function getSupabaseOrNull(): SupabaseClient | null {
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(_client);
}

export async function getSessionOrNull(): Promise<Session | null> {
  const sb = getSupabaseOrNull();
  if (!sb) return null;

  const { data, error } = await sb.auth.getSession();

  if (error) {
    console.log('SUPABASE_GET_SESSION_ERROR', error);
    return null;
  }

  return data.session ?? null;
}

export async function clearBrokenSupabaseSession() {
  const sb = getSupabaseOrNull();
  if (!sb) return;

  try {
    await sb.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.log('SUPABASE_CLEAR_LOCAL_SESSION_ERROR', error);
  }
}