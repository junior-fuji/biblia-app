import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';

type Handlers = {
  onSaveStudy?: (payload: any) => Promise<void>;
  onGeneric?: (name: string, payload?: any) => Promise<void>;
};

export function useReplayPendingAction(handlers: Handlers) {
  const { user, loading, consumePendingAction } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;

    const action = consumePendingAction();
    if (!action) return;

    (async () => {
      try {
        if (action.type === 'saveStudy') {
          await handlers.onSaveStudy?.(action.payload);
        } else if (action.type === 'generic') {
          await handlers.onGeneric?.(action.name, action.payload);
        }
      } catch (e) {
        // aqui você pode logar/mostrar toast
        console.error('[ReplayPendingAction] Falha ao executar ação pendente:', e);
      }
    })();
  }, [user?.id, loading, consumePendingAction, handlers]);
}