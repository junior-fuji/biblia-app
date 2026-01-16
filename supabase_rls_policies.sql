-- Políticas de Row Level Security (RLS) para acesso público
-- Execute este script no Supabase SQL Editor após criar as tabelas

-- Habilita RLS nas tabelas
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para books (todos podem ler)
CREATE POLICY "Public Books" ON public.books
  FOR SELECT
  USING (true);

-- Política de leitura pública para verses (todos podem ler)
CREATE POLICY "Public Verses" ON public.verses
  FOR SELECT
  USING (true);

-- Política de leitura pública para notes (todos podem ler)
-- Nota: Você pode querer restringir isso mais tarde para apenas o dono da nota
CREATE POLICY "Public Notes" ON public.notes
  FOR SELECT
  USING (true);

-- Opcional: Se quiser permitir que usuários autenticados criem/editem suas próprias notas
-- Descomente as linhas abaixo:

-- CREATE POLICY "Users can insert their own notes" ON public.notes
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own notes" ON public.notes
--   FOR UPDATE
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own notes" ON public.notes
--   FOR DELETE
--   USING (auth.uid() = user_id);

