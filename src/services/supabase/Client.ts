// Compatibilidade: compartilha cliente, sessão e listener com o módulo canônico.
export {
  getSupabaseOrThrow,
  getSupabaseOrNull,
  isSupabaseConfigured,
  getSessionOrNull,
  clearBrokenSupabaseSession,
} from '../../../lib/supabaseClient';
