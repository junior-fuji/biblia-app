require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Importar só as que estão 0
const versions = [
  { code: 'ACF', file: './ACF.json' },
  { code: 'KJA', file: './KJA.json' },
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
  return data.id; // UUID
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