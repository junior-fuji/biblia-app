import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type Session, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const extra = (Constants.expoConfig?.extra ?? (Constants as any).manifest2?.extra ?? {}) as {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extra.EXPO_PUBLIC_SUPABASE_URL ||
  extra.supabaseUrl;

const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  extra.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  extra.supabasePublishableKey;

let _client: SupabaseClient | null = null;
let _appStateSubscribed = false;

function createSupabaseInstance(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase não configurado. Faltam ENV: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    );
  }

  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(supabasePublishableKey)) {
    throw new Error('Configuração Supabase inválida: use uma chave pública sb_publishable_.');
  }

  const client = createClient(supabaseUrl, supabasePublishableKey, {
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

if (supabaseUrl && supabasePublishableKey) {
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