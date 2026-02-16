// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Expo publica variáveis com prefixo EXPO_PUBLIC_ (acessíveis no app)
 * iOS/Android/Web: process.env.EXPO_PUBLIC_...
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Mantemos o cliente como singleton interno.
 * NÃO exportamos "supabase" direto para evitar conflitos/duplicações.
 */
let _client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // importante no mobile
    },
  });
}

/**
 * Use quando você quer que a tela quebre claramente se não houver ENV.
 * (Útil para não ficar em "tela vazia".)
 */
export function getSupabaseOrThrow(): SupabaseClient {
  if (!_client) {
    throw new Error(
      'Supabase não configurado. Faltam ENV: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return _client;
}

/**
 * Use quando você quer permitir o app rodar sem Supabase (modo offline/local).
 */
export function getSupabaseOrNull(): SupabaseClient | null {
  return _client;
}

/**
 * Helper opcional: para telas/serviços que querem uma checagem explícita.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(_client);
}
