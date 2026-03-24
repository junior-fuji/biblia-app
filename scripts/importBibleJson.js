const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const versions = [
  { code: 'ARC', file: path.resolve(__dirname, 'ARC.json') },
  { code: 'NVI', file: path.resolve(__dirname, 'NVI.json') },
  { code: 'ACF', file: path.resolve(__dirname, 'ACF.json') },
  { code: 'KJA', file: path.resolve(__dirname, 'KJA.json') },
];

async function getVersionId(code) {
  const { data, error } = await supabase
    .from('bible_versions')
    .select('id')
    .eq('code', code)
    .single();

  if (error) {
    console.error(`Erro buscando versão ${code}:`, error.message);
    return null;
  }

  return data.id;
}

async function clearVersion(versionId, code) {
  const { error } = await supabase
    .from('bible_verses')
    .delete()
    .eq('version_id', versionId);

  if (error) {
    console.error(`Erro limpando ${code}:`, error.message);
    return false;
  }

  console.log(`🧹 ${code} limpa em bible_verses`);
  return true;
}

async function importVersion(code, filePath) {
  const versionId = await getVersionId(code);
  if (!versionId) return;

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`\n🚀 Importando ${code} (ID ${versionId})`);
  console.log(`📄 Arquivo: ${filePath}`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const books = JSON.parse(raw);

  if (!Array.isArray(books)) {
    console.error(`${code}: JSON inválido, esperado array de livros.`);
    return;
  }

  console.log(`📚 ${code}: ${books.length} livros encontrados`);

  const cleared = await clearVersion(versionId, code);
  if (!cleared) return;

  for (let bookIndex = 0; bookIndex < books.length; bookIndex++) {
    const bookNumber = bookIndex + 1;
    const book = books[bookIndex];

    if (!book || !Array.isArray(book.chapters)) {
      console.error(`${code}: livro ${bookNumber} sem chapters válido`);
      return;
    }

    const chapters = book.chapters;

    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const chapterNumber = chapterIndex + 1;
      const verses = chapters[chapterIndex];

      if (!Array.isArray(verses)) {
        console.error(
          `${code}: livro ${bookNumber} capítulo ${chapterNumber} inválido`
        );
        return;
      }

      const rows = verses.map((text, verseIndex) => ({
        version_id: versionId,
        book: bookNumber,
        chapter: chapterNumber,
        verse: verseIndex + 1,
        text: String(text).trim(),
      }));

      const { error } = await supabase
        .from('bible_verses')
        .insert(rows);

      if (error) {
        console.error(
          `Erro ${code} Livro ${bookNumber} Cap ${chapterNumber}:`,
          error.message
        );
        return;
      }

      console.log(`${code} - Livro ${bookNumber} Cap ${chapterNumber} OK`);
    }
  }

  const { count, error: countError } = await supabase
    .from('bible_verses')
    .select('*', { count: 'exact', head: true })
    .eq('version_id', versionId);

  if (countError) {
    console.error(`Erro validando ${code}:`, countError.message);
    return;
  }

  console.log(`✅ ${code} importada com sucesso! Total: ${count}`);
}

async function run() {
  for (const v of versions) {
    await importVersion(v.code, v.file);
  }

  console.log('\n🎉 Todas as versões concluídas!');
}

run();