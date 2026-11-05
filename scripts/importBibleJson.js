function validateSupabaseConfig(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (typeof url !== 'string' || !url || url !== url.trim()) {
    throw new Error('SUPABASE_URL ausente ou inválida.');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('SUPABASE_URL ausente ou inválida.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if ((parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) ||
      !parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash ||
      parsed.pathname !== '/') {
    throw new Error('SUPABASE_URL ausente ou inválida.');
  }
  if (typeof key !== 'string' || !/^sb_secret_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('SUPABASE_SECRET_KEY ausente ou inválida; use uma chave sb_secret_.');
  }
}

// require() apenas carrega o módulo; somente a chamada direta pode importar.
if (require.main === module) {
  if (!process.argv.slice(2).includes('--execute-import')) {
    console.error('Importação bloqueada: informe --execute-import explicitamente.');
    process.exitCode = 1;
  } else if (process.env.NODE_ENV === 'test' || process.env.NODE_TEST_CONTEXT ||
             process.env.JEST_WORKER_ID || process.env.VITEST) {
    console.error('Importação bloqueada: contexto de teste detectado.');
    process.exitCode = 1;
  } else {
    try {
      executeImport();
    } catch {
      console.error('Importação não iniciada: verifique SUPABASE_URL, SUPABASE_SECRET_KEY e dependências locais.');
      process.exitCode = 1;
    }
  }
}

function executeImport() {
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
validateSupabaseConfig(process.env);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;


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
}
