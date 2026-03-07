// split-json.js
const fs = require("fs");

const inputFile = "rv1909_supabase.json";
const batchSize = 5000;

const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

for (let i = 0; i < data.length; i += batchSize) {
  const chunk = data.slice(i, i + batchSize);
  const name = `rv1909_part_${String(i / batchSize + 1).padStart(2, "0")}.json`;
  fs.writeFileSync(name, JSON.stringify(chunk, null, 2), "utf8");
  console.log("✅ Criado:", name, "-", chunk.length);
}