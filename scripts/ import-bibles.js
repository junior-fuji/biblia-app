const fs = require("fs")
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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