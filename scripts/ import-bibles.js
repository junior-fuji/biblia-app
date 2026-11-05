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
const fs = require("fs")
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function importBible(file, versionCode) {
  const data = JSON.parse(fs.readFileSync(file))

  const { data: version } = await supabase
    .from("bible_versions")
    .select("id")
    .eq("code", versionCode)
    .single()

  const versionId = version.id

  let rows = []

  data.books.forEach((book, bookIndex) => {
    book.chapters.forEach((chapter, chapterIndex) => {
      chapter.forEach((text, verseIndex) => {
        rows.push({
          version_id: versionId,
          book: bookIndex + 1,
          chapter: chapterIndex + 1,
          verse: verseIndex + 1,
          text
        })
      })
    })
  })

  await supabase.from("bible_verses").insert(rows)

  console.log(`Importado ${versionCode}`)
}

async function run() {
  await importBible("data/acf.json", "ACF")
  await importBible("data/arc.json", "ARC")
  await importBible("data/nvi.json", "NVI")
}

run()
}
