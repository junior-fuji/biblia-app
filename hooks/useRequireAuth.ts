import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

type RequireAuthOptions = {
  message?: string;
  redirectTo?: string; // rota de login
  action?: { type: 'saveStudy'; payload: any } | { type: 'generic'; name: string; payload?: any };
  // se quiser, você troca Alert por Modal depois
};

export function useRequireAuth() {
  const router = useRouter();
  const { user, loading, setPendingAction } = useAuth();

  const requireAuth = useCallback(
    (opts?: RequireAuthOptions) => {
      const redirectTo = opts?.redirectTo ?? '/';
      const msg = opts?.message ?? 'Você precisa estar logado para continuar.';

      // se ainda está hidratando, bloqueia para evitar falso "deslogado"
      if (loading) {
        Alert.alert('Aguarde', 'Carregando sua sessão...');
        return { ok: false as const, userId: null as string | null };
      }

      if (!user?.id) {
        if (opts?.action) setPendingAction(opts.action);
        Alert.alert('Login necessário', msg, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entrar', onPress: () => router.replace(redirectTo) },
        ]);
        return { ok: false as const, userId: null as string | null };
      }

      return { ok: true as const, userId: user.id };
    },
    [loading, user?.id, router, setPendingAction]
  );

  return { requireAuth };
}