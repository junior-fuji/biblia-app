'use client';

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
      if (mounted) {
        setSession(null);
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    async function syncAll() {
      try {
        await syncLocalNotesToCloud();
        await syncLocalStudies();
        await processSyncQueue();console.log('Sincronização completa.');
      } catch (err) {
        console.log('Erro na sincronização.');
      }
    }

    // 🔹 1. Sessão inicial
    sb.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      setSession(data.session ?? null);
      setLoading(false);

      if (data.session?.user) {
        await syncAll();
      }
    });

    // 🔹 2. Listener de login/logout
    const { data: listener } = sb.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession ?? null);

        // 🔥 sincroniza quando loga
        if (nextSession?.user) {
          await syncAll();
        }
      }
    );

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe();
      } catch {}
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