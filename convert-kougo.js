const fs = require("fs");

const inputFile = "kougo.json";
const outputFile = "kougo_supabase.json";

const VERSION_ID = "f90cbb0b-db8c-412a-8930-2a15a993e457";

try {

  const raw = fs.readFileSync(inputFile, "utf8");
  const data = JSON.parse(raw);

  let verses = [];

  if (Array.isArray(data.verses)) {
    verses = data.verses.map(v => ({
      version_id: VERSION_ID,
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text
    }));
  } 
  else if (Array.isArray(data)) {
    verses = data.map(v => ({
      version_id: VERSION_ID,
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text
    }));
  } 
  else {
    console.log("Formato desconhecido");
    process.exit();
  }

  fs.writeFileSync(
    outputFile,
    JSON.stringify(verses, null, 2),
    "utf8"
  );

  console.log("✅ Conversão concluída");
  console.log("Versículos:", verses.length);
  console.log("Arquivo:", outputFile);

} catch (err) {
  console.error("❌ Erro:", err.message);
}