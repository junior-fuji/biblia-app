import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const extra = (Constants.expoConfig?.extra ?? (Constants as any).manifest2?.extra ?? {}) as any;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;

let _client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: Platform.OS === 'web' ? undefined : AsyncStorage, // <-- AQUI
    },
  });
}
export * from '@/lib/supabaseClient';
export function getSupabaseOrNull() {
  return _client;
}
export function getSupabaseOrThrow() {
  if (!_client) throw new Error('Supabase não configurado.');
  return _client;
}