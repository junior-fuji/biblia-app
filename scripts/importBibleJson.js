const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://eoefipjqrlhnkfzaigfx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZWZpcGpxcmxobmtmemFpZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwNDM2MCwiZXhwIjoyMDgyNTgwMzYwfQ.9WsjSB7GaTgKwR84qJyjbyiEig7XSJcHBazgZkrGZuQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const versions = [
  { code: 'ARC', file: './ARC.json' },
  { code: 'NVI', file: './NVI.json' },
  { code: 'ACF', file: './ACF.json' },
  { code: 'KJA', file: './KJA.json' },
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

async function importVersion(code, filePath) {
  const versionId = await getVersionId(code);
  if (!versionId) return;

  console.log(`\n🚀 Importando ${code} (ID ${versionId})`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const books = JSON.parse(raw);

  for (let bookIndex = 0; bookIndex < books.length; bookIndex++) {
    const bookNumber = bookIndex + 1;
    const chapters = books[bookIndex].chapters;

    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const chapterNumber = chapterIndex + 1;
      const verses = chapters[chapterIndex];

      const rows = verses.map((text, verseIndex) => ({
        version_id: versionId,
        book: bookNumber,
        chapter: chapterNumber,
        verse: verseIndex + 1,
        text,
      }));

      const { error } = await supabase.from('verses').insert(rows);

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

  console.log(`✅ ${code} importada com sucesso!`);
}

async function run() {
  for (const v of versions) {
    if (fs.existsSync(v.file)) {
      await importVersion(v.code, v.file);
    } else {
      console.log(`Arquivo não encontrado: ${v.file}`);
    }
  }

  console.log('\n🎉 Todas as versões concluídas!');
}

run();