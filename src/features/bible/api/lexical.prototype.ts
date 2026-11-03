import type { LexicalVerse } from './lexical.types';

/**
 * Fixtures arquiteturais do MVP.
 *
 * IMPORTANTE:
 * - não são dados de produção;
 * - não substituem datasets lexicais licenciados/auditados;
 * - servem para provar que o contrato suporta alinhamentos 1:N/N:1/N:M,
 *   componentes morfológicos e palavras funcionais sem equivalência direta.
 */

export const genesis1_1Prototype: LexicalVerse = {
  bibleVerseId: 'prototype:genesis:1:1',
  translationVersionId: 'prototype-pt',
  translationTextHash: 'prototype-only',
  tokenizationVersion: 'prototype-v1',
  offsetEncoding: 'utf-16',
  originalEditionCode: 'prototype-hebrew',
  translationTokens: [
    { id: 'pt-gen-1-1-1', position: 1, text: 'No princípio', startOffset: 0, endOffset: 12 },
    { id: 'pt-gen-1-1-2', position: 2, text: 'Deus', startOffset: 13, endOffset: 17 },
    { id: 'pt-gen-1-1-3', position: 3, text: 'criou', startOffset: 18, endOffset: 23 },
  ],
  originalTokens: [
    {
      id: 'he-gen-1-1-1', position: 1, surface: 'בְּרֵאשִׁית', normalized: null,
      lemma: { id: 'lemma-reshit', language: 'hebrew', lemma: 'רֵאשִׁית', transliteration: 'reshit', gloss: 'princípio', identifiers: [] },
      morphology: null,
      components: [
        { id: 'he-gen-1-1-1a', position: 1, surface: 'בְּ', lemma: null, morphology: 'preposition' },
        { id: 'he-gen-1-1-1b', position: 2, surface: 'רֵאשִׁית', lemma: { id: 'lemma-reshit', language: 'hebrew', lemma: 'רֵאשִׁית', transliteration: 'reshit', gloss: 'princípio', identifiers: [] }, morphology: 'noun' },
      ],
    },
    {
      id: 'he-gen-1-1-3', position: 3, surface: 'אֱלֹהִים', normalized: null,
      lemma: { id: 'lemma-elohim', language: 'hebrew', lemma: 'אֱלֹהִים', transliteration: 'elohim', gloss: 'Deus/deuses', identifiers: [{ scheme: 'strong', value: 'H430' }] },
      morphology: 'noun masculine plural', components: [],
    },
    {
      id: 'he-gen-1-1-2', position: 2, surface: 'בָּרָא', normalized: null,
      lemma: { id: 'lemma-bara', language: 'hebrew', lemma: 'בָּרָא', transliteration: 'bara', gloss: 'criar', identifiers: [{ scheme: 'strong', value: 'H1254' }] },
      morphology: 'verb', components: [],
    },
  ],
  alignments: [
    { id: 'a-gen-1', translationTokenIds: ['pt-gen-1-1-1'], originalTokenIds: ['he-gen-1-1-1'], note: 'Português contrai preposição + artigo; hebraico possui prefixo preposicional.' },
    { id: 'a-gen-2', translationTokenIds: ['pt-gen-1-1-2'], originalTokenIds: ['he-gen-1-1-3'], note: null },
    { id: 'a-gen-3', translationTokenIds: ['pt-gen-1-1-3'], originalTokenIds: ['he-gen-1-1-2'], note: 'A ordem sintática difere entre os idiomas.' },
  ],
};

export const john1_1Prototype: LexicalVerse = {
  bibleVerseId: 'prototype:john:1:1',
  translationVersionId: 'prototype-pt',
  translationTextHash: 'prototype-only',
  tokenizationVersion: 'prototype-v1',
  offsetEncoding: 'utf-16',
  originalEditionCode: 'prototype-greek',
  translationTokens: [
    { id: 'pt-jhn-1-1-1', position: 1, text: 'No princípio', startOffset: 0, endOffset: 12 },
    { id: 'pt-jhn-1-1-2', position: 2, text: 'Verbo', startOffset: 13, endOffset: 18 },
  ],
  originalTokens: [
    {
      id: 'gr-jhn-1-1-1', position: 1, surface: 'Ἐν', normalized: 'ἐν',
      lemma: { id: 'lemma-en', language: 'greek', lemma: 'ἐν', transliteration: 'en', gloss: 'em', identifiers: [{ scheme: 'strong', value: 'G1722' }] },
      morphology: 'preposition', components: [],
    },
    {
      id: 'gr-jhn-1-1-2', position: 2, surface: 'ἀρχῇ', normalized: null,
      lemma: { id: 'lemma-arche', language: 'greek', lemma: 'ἀρχή', transliteration: 'arche', gloss: 'princípio', identifiers: [{ scheme: 'strong', value: 'G746' }] },
      morphology: 'noun dative singular feminine', components: [],
    },
    {
      id: 'gr-jhn-1-1-5', position: 5, surface: 'λόγος', normalized: null,
      lemma: { id: 'lemma-logos', language: 'greek', lemma: 'λόγος', transliteration: 'logos', gloss: 'palavra/discurso', identifiers: [{ scheme: 'strong', value: 'G3056' }] },
      morphology: 'noun nominative singular masculine', components: [],
    },
  ],
  alignments: [
    { id: 'a-jhn-1', translationTokenIds: ['pt-jhn-1-1-1'], originalTokenIds: ['gr-jhn-1-1-1', 'gr-jhn-1-1-2'], note: 'Exemplo N:1: dois tokens gregos correspondem ao sintagma português.' },
    { id: 'a-jhn-2', translationTokenIds: ['pt-jhn-1-1-2'], originalTokenIds: ['gr-jhn-1-1-5'], note: 'O gloss lexical de λόγος não deve ser confundido com a escolha contextual/tradicional “Verbo”.' },
  ],
};
