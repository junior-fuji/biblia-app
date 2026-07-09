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
  loading: boolean;
  session: Session | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue>({
  initialized: false,
  loading: true,
  session: null,
  user: null,
});

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return '';
  }

  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return '';
}

function isBrokenRefreshTokenError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('refresh_token_not_found')
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

            try {
              await sb.auth.signOut({ scope: 'local' });
            } catch (signOutError) {
              console.log('AUTH_BOOTSTRAP_SIGN_OUT_ERROR', signOutError);
            }
          }

          if (!mounted) return;

          setSession(null);
          setInitialized(true);
          return;
        }

        if (!mounted) return;

        setSession(data.session ?? null);
        setInitialized(true);
      } catch (error) {
        console.log('AUTH_BOOTSTRAP_FATAL', error);

        if (isBrokenRefreshTokenError(error)) {
          await clearBrokenSupabaseSession();

          try {
            await sb.auth.signOut({ scope: 'local' });
          } catch (signOutError) {
            console.log('AUTH_BOOTSTRAP_FATAL_SIGN_OUT_ERROR', signOutError);
          }
        }

        if (!mounted) return;

        setSession(null);
        setInitialized(true);
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, nextSession) => {
      console.log('AUTH_STATE_CHANGE', event, Boolean(nextSession?.user?.id));

      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setInitialized(true);

        void clearBrokenSupabaseSession();
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
      loading: !initialized,
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