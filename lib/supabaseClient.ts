// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

let _client: SupabaseClient | null = null;

function buildClient(): SupabaseClient | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseOrNull(): SupabaseClient | null {
  if (_client) return _client;

  const c = buildClient();
  if (!c) {
    if (__DEV__) {
      console.warn(
        "Supabase não configurado. Faltam ENV: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    return null;
  }

  _client = c;
  return _client;
}

export function getSupabaseOrThrow(): SupabaseClient {
  const c = getSupabaseOrNull();
  if (!c) {
    throw new Error(
      "Supabase não configurado. Faltam ENV: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return c;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseOrNull());
}
