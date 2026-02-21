import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as any;

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extra.supabaseUrl;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  extra.supabaseAnonKey;

let _client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
}

export function getSupabaseOrThrow(): SupabaseClient {
  if (!_client) {
    throw new Error(
      'Supabase não configurado. Faltam ENV: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return _client;
}

export function getSupabaseOrNull(): SupabaseClient | null {
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(_client);
}
