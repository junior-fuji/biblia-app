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
validateSupabaseConfig(process.env);
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;


const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

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
}
