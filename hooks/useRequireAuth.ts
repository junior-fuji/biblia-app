// Offline-first: autenticação não é obrigatória para salvar

export function useRequireAuth() {
  const requireAuth = () => {
    return { ok: true as const, userId: null };
  };

  return { requireAuth };
}