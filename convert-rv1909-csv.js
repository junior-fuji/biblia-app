// convert-rv1909-csv.js
const fs = require("fs");

const inputFile = "rv_1909.json";
const outputFile = "rv1909_supabase.csv";
const VERSION_ID = "f0c27d12-92ee-4d41-9188-70b04590de12";

function esc(v) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

try {
  const raw = fs.readFileSync(inputFile, "utf8");
  const data = JSON.parse(raw);

  let verses = [];

  if (Array.isArray(data.verses)) {
    verses = data.verses;
  } else if (Array.isArray(data)) {
    verses = data;
  } else {
    throw new Error("Formato desconhecido");
  }

  const lines = [
    "version_id,book,chapter,verse,text",
    ...verses.map(v =>
      [
        esc(VERSION_ID),
        Number(v.book),
        Number(v.chapter),
        Number(v.verse),
        esc(v.text),
      ].join(",")
    ),
  ];

  fs.writeFileSync(outputFile, lines.join("\n"), "utf8");
  console.log("✅ CSV criado:", outputFile);
  console.log("Versículos:", verses.length);
} catch (err) {
  console.error("❌ Erro:", err.message);
}