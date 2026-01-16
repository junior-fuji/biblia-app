import { createClient } from '@supabase/supabase-js';
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis .env não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const genesisVerses = [
  {
    book_id: 1,
    chapter: 1,
    verse: 1,
    text_pt: "No princípio criou Deus o céu e a terra.",
    text_origin: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    transliteration: "Bereshit bara Elohim et hashamayim ve'et ha'arets",
    words: [
      { 
        hebraico: "בְּרֵאשִׁית", 
        trans: "Bereshit", 
        pt: "No princípio", 
        strong: "H7225", 
        def: "Primeiro, começo, melhor parte, primícias. Refere-se ao início absoluto de tudo." 
      },
      { 
        hebraico: "בָּרָא", 
        trans: "bara", 
        pt: "criou", 
        strong: "H1254", 
        def: "Criar (do nada), moldar, formar. Verbo usado exclusivamente para a atividade criadora divina (ex nihilo)." 
      },
      { 
        hebraico: "אֱלֹהִים", 
        trans: "Elohim", 
        pt: "Deus", 
        strong: "H430", 
        def: "Deus (plural majestático), Juiz Divino, Poderoso. Nome genérico para a divindade." 
      },
      { 
        hebraico: "אֵת", 
        trans: "et", 
        pt: "(marcador)", 
        strong: "H853", 
        def: "Partícula não traduzida que indica o objeto direto definido na frase." 
      },
      { 
        hebraico: "הַשָּׁמַיִם", 
        trans: "hashamayim", 
        pt: "os céus", 
        strong: "H8064", 
        def: "Céus, firmamento, morada de Deus. Palavra sempre no dual/plural." 
      },
      { 
        hebraico: "וְאֵת", 
        trans: "ve'et", 
        pt: "e a", 
        strong: "H853", 
        def: "Conjunção 'E' + Marcador de objeto direto." 
      },
      { 
        hebraico: "הָאָרֶץ", 
        trans: "ha'arets", 
        pt: "terra", 
        strong: "H776", 
        def: "Terra (planeta), solo, território, nação." 
      }
    ]
  },
  {
    book_id: 1,
    chapter: 1,
    verse: 2,
    text_pt: "E a terra era sem forma e vazia...",
    text_origin: "וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ",
    transliteration: "Veha'arets hayetah tohu vavohu",
    words: [
      { hebraico: "וְהָאָרֶץ", trans: "Veha'arets", pt: "E a terra", strong: "H776", def: "Terra, solo." },
      { hebraico: "הָיְתָה", trans: "hayetah", pt: "era", strong: "H1961", def: "Ser, tornar-se, acontecer." },
      { hebraico: "תֹהוּ", trans: "tohu", pt: "sem forma", strong: "H8414", def: "Informidade, confusão, irrealidade, vazio, caos." },
      { hebraico: "וָבֹהוּ", trans: "vavohu", pt: "e vazia", strong: "H922", def: "Vazio, vacuidade, indistinto." }
    ]
  }
];

async function seedGenesis() {
  console.log('✡️ Injetando Dicionário Strong em Gênesis 1...');

  for (const v of genesisVerses) {
    const { error } = await supabase
      .from('verses')
      .upsert(v, { onConflict: 'book_id,chapter,verse' });

    if (error) {
      console.error(`❌ Erro no v.${v.verse}:`, error.message);
    } else {
      console.log(`✅ Gênesis 1:${v.verse} atualizado com Definições!`);
    }
  }
}

seedGenesis();