const fs = require('fs');

const data = JSON.parse(fs.readFileSync('kougo_supabase.json', 'utf8'));

const header = "version_id,book,chapter,verse,text\n";

const rows = data.map(v => {
  const text = String(v.text).replace(/"/g,'""');
  return `${v.version_id},${v.book},${v.chapter},${v.verse},"${text}"`;
});

fs.writeFileSync('kougo_supabase.csv', header + rows.join('\n'));

console.log("CSV criado: kougo_supabase.csv");
