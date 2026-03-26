import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { processSyncQueue } from '@/lib/syncQueue';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const sb = getSupabaseOrNull();

    if (!sb) {
      setSession(null);
      setLoading(false);

      return () => {
        mounted = false;
      };
    }

    async function syncAll() {
      try {
        const result = await processSyncQueue();
        console.log('SYNC_QUEUE_DONE', result);
      } catch (err) {
        console.log('SYNC_QUEUE_ERROR', err);
      }
    }

    async function loadInitialSession() {
      try {
        const { data, error } = await sb.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.log('AUTH_INITIAL_SESSION_ERROR', error.message);
          setSession(null);
          setLoading(false);
          return;
        }

        const currentSession = data.session ?? null;
        setSession(currentSession);
        setLoading(false);

        if (currentSession?.user) {
          await syncAll();
        }
      } catch (err) {
        if (!mounted) return;
        console.log('AUTH_INITIAL_SESSION_FATAL', err);
        setSession(null);
        setLoading(false);
      }
    }

    loadInitialSession();

    const { data: authListener } = sb.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession ?? null);
        setLoading(false);

        if (nextSession?.user) {
          await syncAll();
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}