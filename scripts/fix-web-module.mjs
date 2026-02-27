import fs from "fs";

const file = "dist/index.html";
let html = fs.readFileSync(file, "utf8");

html = html.replace(
  /<script([^>]*?)src="(\/_expo\/static\/js\/web\/entry-[^"]+\.js)"([^>]*?)><\/script>/g,
  (match, before, src, after) => {
    let attrs = `${before}src="${src}"${after}`;
    attrs = attrs.replace(/\sdefer\b/g, "");
    attrs = attrs.replace(/\stype="module"\b/g, "");
    attrs = attrs.replace(/\s+/g, " ").trim();
    return `<script type="module" ${attrs}></script>`;
  }
);

fs.writeFileSync(file, html, "utf8");
console.log("✅ Corrigido: entry carregado como type=module");
