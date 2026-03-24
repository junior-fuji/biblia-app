const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const VERSION_MAP = {
  ACF: 'b56658c3-9981-4406-a3bc-392f367c33b6',
  ARC: 'bb82d1b0-7b75-4e52-826d-60042c04a57c',
  NVI: 'eeb0634e-431f-4317-a1fd-ca624554cda2',
};

const FILES = {
  ACF: path.resolve(__dirname, '../data/acf.json'),
  ARC: path.resolve(__dirname, '../data/arc.json'),
  NVI: path.resolve(__dirname, '../data/nvi.json'),
};

const BATCH_SIZE = 1000;

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function normalizeVerseRecord(raw, versionId) {
  const book = Number(raw.book);
  const chapter = Number(raw.chapter);
  const verse = Number(raw.verse);
  const text = String(raw.text || '').trim();

  if (!Number.isInteger(book)) {
    throw new Error(`book inválido: ${JSON.stringify(raw)}`);
  }
  if (!Number.isInteger(chapter)) {
    throw new Error(`chapter inválido: ${JSON.stringify(raw)}`);
  }
  if (!Number.isInteger(verse)) {
    throw new Error(`verse inválido: ${JSON.stringify(raw)}`);
  }
  if (!text) {
    throw new Error(`text vazio: ${JSON.stringify(raw)}`);
  }

  return {
    version_id: versionId,
    book,
    chapter,
    verse,
    text,
  };
}

async function clearVersion(versionCode, versionId) {
  const { error } = await supabase
    .from('bible_verses')
    .delete()
    .eq('version_id', versionId);

  if (error) throw error;
  console.log(`Versículos antigos removidos: ${versionCode}`);
}

async function insertRows(rows) {
  const { error } = await supabase
    .from('bible_verses')
    .insert(rows);

  if (error) throw error;
}

async function importVersion(versionCode) {
  const versionId = VERSION_MAP[versionCode];
  const filePath = FILES[versionCode];
  const raw = readJson(filePath);

  if (!Array.isArray(raw)) {
    throw new Error(`${versionCode}: o JSON precisa ser um array`);
  }

  await clearVersion(versionCode, versionId);

  const rows = raw.map(item => normalizeVerseRecord(item, versionId));
  const batches = chunkArray(rows, BATCH_SIZE);

  console.log(`${versionCode}: ${rows.length} linhas preparadas`);

  for (let i = 0; i < batches.length; i++) {
    await insertRows(batches[i]);
    console.log(`${versionCode}: lote ${i + 1}/${batches.length}`);
  }
}

async function validateReference(book, chapter, verse) {
  const { data, error } = await supabase
    .from('bible_verses')
    .select(`
      book,
      chapter,
      verse,
      text,
      bible_versions!inner(code)
    `)
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .order('version_id');

  if (error) throw error;

  console.log(`\nValidação ${book}:${chapter}:${verse}`);
  for (const row of data) {
    console.log(`${row.bible_versions.code}: ${row.text}`);
  }
}

async function validateCounts() {
  const codes = Object.keys(VERSION_MAP);

  const { data, error } = await supabase
    .from('bible_verses')
    .select(`
      version_id,
      bible_versions!inner(code)
    `)
    .in('version_id', Object.values(VERSION_MAP));

  if (error) throw error;

  const counts = {};
  for (const row of data) {
    const code = row.bible_versions.code;
    counts[code] = (counts[code] || 0) + 1;
  }

  console.log('\nTotais por versão:');
  for (const code of codes) {
    console.log(`${code}: ${counts[code] || 0}`);
  }
}

async function main() {
  await importVersion('ACF');
  await importVersion('ARC');
  await importVersion('NVI');

  await validateCounts();
  await validateReference(43, 3, 16);
  await validateReference(19, 23, 1);
  await validateReference(45, 12, 2);

  console.log('\nImportação concluída com sucesso.');
}

main().catch((err) => {
  console.error('Erro na importação:', err);
  process.exit(1);
});