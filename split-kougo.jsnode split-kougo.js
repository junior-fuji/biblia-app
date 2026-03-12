const fs = require('fs');

const data = JSON.parse(fs.readFileSync('kougo_supabase.json','utf8'));

const size = 10000;

for (let i = 0; i < data.length; i += size) {
  const chunk = data.slice(i, i + size);
  fs.writeFileSync(`kougo_part_${i/size+1}.json`, JSON.stringify(chunk));
}

console.log("Arquivos criados com sucesso");
