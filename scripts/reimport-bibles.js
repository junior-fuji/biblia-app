const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const VERSION_FILES = {
  ARA: path.resolve(__dirname, '../data/ara.json'),
  ARC: path.resolve(__dirname, '../data/arc.json'),
  ACF: path.resolve(__dirname, '../data/acf.json'),
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

async function getVersionMap() {
  const { data, error } = await supabase
    .from('bible_versions')
    .select('id, code');

  if (error) throw error;

  const map = {};
  for (const row of data) {
    map[row.code] = row.id;
  }
  return map;
}

async function deleteVersionVerses(versionCode) {
  const { data: versionRow, error: versionError } = await supabase
    .from('bible_versions')
    .select('id')
    .eq('code', versionCode)
    .single();

  if (versionError) throw versionError;

  const { error: deleteError } = await supabase
    .from('bible_verses')
    .delete()
    .eq('version_id', versionRow.id);

  if (deleteError) throw deleteError;

  console.log(`Versículos removidos da versão ${versionCode}`);
}

async function insertBatch(rows) {
  const { error } = await supabase
    .from('bible_verses')
    .insert(rows);

  if (error) {
    throw error;
  }
}

async function validateVersion(versionCode, versionId) {
  const { count, error } = await supabase
    .from('bible_verses')
    .select('*', { count: 'exact', head: true })
    .eq('version_id', versionId);

  if (error) throw error;

  console.log(`Validação ${versionCode}: ${count} versículos`);
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

  console.log(`\nReferência ${book}:${chapter}:${verse}`);
  for (const row of data) {
    console.log(`${row.bible_versions.code}: ${row.text}`);
  }
}

async function importVersion(versionCode, filePath, versionId) {
  console.log(`\nImportando ${versionCode} de ${filePath}`);

  const rawData = readJson(filePath);
  if (!Array.isArray(rawData)) {
    throw new Error(`O arquivo ${filePath} precisa ser um array JSON.`);
  }

  const rows = rawData.map((item) => normalizeVerseRecord(item, versionId));
  const chunks = chunkArray(rows, BATCH_SIZE);

  console.log(`${versionCode}: ${rows.length} linhas preparadas`);

  for (let i = 0; i < chunks.length; i++) {
    await insertBatch(chunks[i]);
    console.log(`${versionCode}: lote ${i + 1}/${chunks.length} inserido`);
  }

  await validateVersion(versionCode, versionId);
}

async function main() {
  const versionMap = await getVersionMap();

  for (const versionCode of Object.keys(VERSION_FILES)) {
    if (!versionMap[versionCode]) {
      throw new Error(`Versão ${versionCode} não encontrada em bible_versions`);
    }
  }

  for (const versionCode of Object.keys(VERSION_FILES)) {
    await deleteVersionVerses(versionCode);
    await importVersion(versionCode, VERSION_FILES[versionCode], versionMap[versionCode]);
  }

  await validateReference(43, 3, 16);
  await validateReference(19, 23, 1);
  await validateReference(45, 12, 2);

  console.log('\nReimportação concluída com sucesso.');
}

main().catch((err) => {
  console.error('Erro na reimportação:', err);
  process.exit(1);
});