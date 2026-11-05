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
require('dotenv').config();
validateSupabaseConfig(process.env);
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;


const supabase = createClient(supabaseUrl, supabaseKey);

// Importar só as que estão 0
const versions = [
  { code: 'ARC', file: './ARC.json' },
  { code: 'NVI', file: './NVI.json' },
];

async function getVersionId(code) {
  const { data, error } = await supabase
    .from('bible_versions')
    .select('id, code')
    .eq('code', code)
    .single();

  if (error) {
    console.error(`❌ Não achei bible_versions.code='${code}':`, error.message);
    return null;
  }
  return data.id;
}

async function upsertBatch(rows) {
  const { error } = await supabase
    .from('bible_verses')
    .upsert(rows, { onConflict: 'version_id,book,chapter,verse' });

  if (error) throw error;
}

async function importVersion(code, filePath) {
  const versionId = await getVersionId(code);
  if (!versionId) return;

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`\n🚀 Importando ${code} (version_id=${versionId})`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const books = JSON.parse(raw);

  let total = 0;

  for (let bookIndex = 0; bookIndex < books.length; bookIndex++) {
    const bookNumber = bookIndex + 1;
    const chapters = books[bookIndex]?.chapters ?? [];

    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const chapterNumber = chapterIndex + 1;
      const verses = chapters[chapterIndex] ?? [];

      let batch = [];
      for (let verseIndex = 0; verseIndex < verses.length; verseIndex++) {
        batch.push({
          version_id: versionId,
          book: bookNumber,
          chapter: chapterNumber,
          verse: verseIndex + 1,
          text: String(verses[verseIndex] ?? ''),
        });

        if (batch.length >= 500) {
          await upsertBatch(batch);
          total += batch.length;
          batch = [];
        }
      }

      if (batch.length) {
        await upsertBatch(batch);
        total += batch.length;
      }

      console.log(`${code} OK — Livro ${bookNumber} Cap ${chapterNumber}`);
    }
  }

  console.log(`✅ ${code} concluído. Total upsert: ${total}`);
}

async function run() {
  try {
    for (const v of versions) {
      await importVersion(v.code, v.file);
    }
    console.log('\n🎉 Finalizado.');
  } catch (e) {
    console.error('\n🔥 ERRO FATAL:', e?.message || e);
    if (e?.details) console.error('details:', e.details);
    if (e?.hint) console.error('hint:', e.hint);
  }
}

run();
}
