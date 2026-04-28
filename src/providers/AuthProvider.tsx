import {
  clearBrokenSupabaseSession,
  getSupabaseOrNull,
} from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type AuthContextValue = {
  initialized: boolean;
  session: Session | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue>({
  initialized: false,
  session: null,
  user: null,
});

function isBrokenRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : '';

  return (
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found')
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseClient = useMemo(() => getSupabaseOrNull(), []);

  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!supabaseClient) {
      setSession(null);
      setInitialized(true);

      return () => {
        mounted = false;
      };
    }

    const sb = supabaseClient;

    async function bootstrap() {
      try {
        const { data, error } = await sb.auth.getSession();

        if (error) {
          console.log('AUTH_BOOTSTRAP_GET_SESSION_ERROR', error);

          if (isBrokenRefreshTokenError(error)) {
            await clearBrokenSupabaseSession();
          }

          if (!mounted) {
            return;
          }

          setSession(null);
          setInitialized(true);
          return;
        }

        if (!mounted) {
          return;
        }

        setSession(data.session ?? null);
        setInitialized(true);
      } catch (error) {
        console.log('AUTH_BOOTSTRAP_FATAL', error);

        if (!mounted) {
          return;
        }

        setSession(null);
        setInitialized(true);
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, nextSession) => {
      console.log('AUTH_STATE_CHANGE', event, Boolean(nextSession?.user?.id));

      if (!mounted) {
        return;
      }

      setSession(nextSession ?? null);
      setInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
    }),
    [initialized, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}