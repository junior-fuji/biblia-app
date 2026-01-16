-- Schema SQL para o App de Bíblia de Estudo Profundo
-- Execute este script no Supabase SQL Editor

-- Tabela de Livros da Bíblia
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  testament VARCHAR(20) NOT NULL CHECK (testament IN ('Antigo Testamento', 'Novo Testamento')),
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Versículos
CREATE TABLE IF NOT EXISTS verses (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text_pt TEXT NOT NULL,
  text_hebraico TEXT,
  text_grego TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(book_id, chapter, verse_number)
);

-- Tabela de Notas de Estudo
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  verse_id INTEGER NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Mapas/Referências
CREATE TABLE IF NOT EXISTS maps (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  region VARCHAR(100),
  period VARCHAR(100),
  coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter);
CREATE INDEX IF NOT EXISTS idx_verses_book_chapter_verse ON verses(book_id, chapter, verse_number);
CREATE INDEX IF NOT EXISTS idx_notes_verse_id ON notes(verse_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_books_testament ON books(testament);
CREATE INDEX IF NOT EXISTS idx_books_order ON books(order_number);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verses_updated_at BEFORE UPDATE ON verses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maps_updated_at BEFORE UPDATE ON maps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE books IS 'Tabela contendo todos os livros da Bíblia';
COMMENT ON TABLE verses IS 'Tabela contendo os versículos com textos em português, hebraico e grego';
COMMENT ON TABLE notes IS 'Tabela para notas de estudo pessoais dos usuários';
COMMENT ON TABLE maps IS 'Tabela para mapas bíblicos e referências geográficas';

