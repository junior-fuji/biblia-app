import { clearBrokenSupabaseSession, getSupabaseOrNull } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabaseOrNull();

  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!sb) {
      setInitialized(true);
      return;
    }

    const bootstrap = async () => {
      try {
        const { data, error } = await sb.auth.getSession();

        if (error) {
          console.log('AUTH_BOOTSTRAP_GET_SESSION_ERROR', error);

          const msg = String(error.message || '');
          if (
            msg.includes('Invalid Refresh Token') ||
            msg.includes('Refresh Token Not Found')
          ) {
            await clearBrokenSupabaseSession();
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
        if (!mounted) return;
        setSession(null);
        setInitialized(true);
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, nextSession) => {
      console.log('AUTH_STATE_CHANGE', event, Boolean(nextSession?.user?.id));
      if (!mounted) return;
      setSession(nextSession ?? null);
      setInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sb]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
    }),
    [initialized, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}