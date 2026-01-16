import { createClient } from '@supabase/supabase-js';
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis .env não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// URL da Bíblia Almeida em JSON (Open Source)
const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json';

async function seedBibleText() {
  console.log('🌍 Baixando a Bíblia da internet...');
  
  try {
    const response = await fetch(BIBLE_JSON_URL);
    const bibleData = await response.json();
    
    console.log(`📖 Download concluído! Processando ${bibleData.length} livros...`);

    // Loop por cada livro da Bíblia baixada
    for (let i = 0; i < bibleData.length; i++) {
      const bookData = bibleData[i];
      const bookId = i + 1; // Assumindo que a ordem é a padrão (Gênesis=1, Apoc=66)
      const bookName = bookData.name;

      console.log(`\n📘 Processando Livro ${bookId}: ${bookName}...`);

      const versesToInsert = [];

      // Loop pelos capítulos
      for (let c = 0; c < bookData.chapters.length; c++) {
        const chapterNum = c + 1;
        const chapterVerses = bookData.chapters[c];

        // Loop pelos versículos
        for (let v = 0; v < chapterVerses.length; v++) {
          const verseNum = v + 1;
          const text = chapterVerses[v];

          versesToInsert.push({
            book_id: bookId,
            chapter: chapterNum,
            verse: verseNum,
            text_pt: text,
            // Deixamos os campos interlineares vazios por enquanto
            text_origin: null,
            transliteration: null,
            words: null
          });
        }
      }

      // Inserção em Lote (Bulk Insert) para ser rápido
      // O Supabase aguenta bem lotes de 1000, mas vamos por livro para ser seguro
      const { error } = await supabase.from('verses').upsert(versesToInsert, { 
        onConflict: 'book_id,chapter,verse', // Garante não duplicar
        ignoreDuplicates: false 
      });

      if (error) {
        console.error(`❌ Erro ao salvar ${bookName}:`, error.message);
      } else {
        console.log(`✅ ${bookName} salvo com ${versesToInsert.length} versículos.`);
      }
    }

    console.log('\n🚀 BÍBLIA COMPLETA IMPORTADA COM SUCESSO!');

  } catch (error) {
    console.error('❌ Erro fatal no script:', error);
  }
}

seedBibleText();