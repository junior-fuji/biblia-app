const fs = require("fs");

const raw = require("./assets/harpa_crista_640_hinos.json");

function htmlToText(s) {
  return (s || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim();
}

const result = [];

for (const [key, value] of Object.entries(raw)) {
  const number = Number(key);

  if (!Number.isFinite(number) || number <= 0) continue;

  const title = value.hino.replace(/^\d+\s*-\s*/, "").trim();

  const verses = Object.entries(value.verses || {}).map(
    ([n, text]) => ({
      number: Number(n),
      text: htmlToText(text),
    })
  );

  result.push({
    number,
    title,
    coro: htmlToText(value.coro || ""),
    verses,
  });
}

result.sort((a, b) => a.number - b.number);

fs.writeFileSync(
  "./assets/harpa_clean.json",
  JSON.stringify(result, null, 2),
  "utf-8"
);

console.log("Harpa convertida com sucesso!");