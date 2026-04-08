import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const extra = (Constants.expoConfig?.extra ?? (Constants as any).manifest2?.extra ?? {}) as any;

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extra.supabaseUrl ||
  process.env.SUPABASE_URL;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  extra.supabaseAnonKey;

let _client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseOrNull(): SupabaseClient | null {
  return _client;
}

export function getSupabaseOrThrow(): SupabaseClient {
  if (!_client) {
    throw new Error(
      'Supabase não configurado. Faltam ENV: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(_client);
}