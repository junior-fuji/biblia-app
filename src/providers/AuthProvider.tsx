import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { syncLocalNotesToCloud } from '@/lib/syncNotes';
import { processSyncQueue } from '@/lib/syncQueue';
import { syncLocalStudies } from '@/lib/syncStudies';
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
        await syncLocalNotesToCloud();
        await syncLocalStudies();
        await processSyncQueue();
        console.log('Sincronização completa.');
      } catch (err) {
        console.log('Erro na sincronização.', err);
      }
    }

    async function loadInitialSession() {
      try {
        const { data, error } = await sb.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.log('Erro ao obter sessão inicial:', error.message);
          setSession(null);
          setLoading(false);
          return;
        }

        const currentSession = data.session ?? null;
        setSession(currentSession);
        setLoading(false);

        if (currentSession?.user) {
          syncAll();
        }
      } catch (err) {
        if (!mounted) return;
        console.log('Erro inesperado ao carregar sessão:', err);
        setSession(null);
        setLoading(false);
      }
    }

    loadInitialSession();

    const { data: authListener } = sb.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession ?? null);
        setLoading(false);

        if (nextSession?.user) {
          syncAll();
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