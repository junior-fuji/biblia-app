export type LexicalLanguage = 'hebrew' | 'aramaic' | 'greek';

export type LexicalIdentifier = {
  scheme: 'strong' | 'step-extended-strong' | string;
  value: string;
};

export type LexicalLemma = {
  id: string;
  language: LexicalLanguage;
  lemma: string;
  transliteration: string | null;
  gloss: string | null;
  identifiers: LexicalIdentifier[];
};

export type OriginalTokenComponent = {
  id: string;
  position: number;
  surface: string;
  lemma: LexicalLemma | null;
  morphology: string | null;
};

export type OriginalToken = {
  id: string;
  position: number;
  surface: string;
  normalized: string | null;
  lemma: LexicalLemma | null;
  morphology: string | null;
  components: OriginalTokenComponent[];
};

export type TranslationToken = {
  id: string;
  position: number;
  text: string;
  startOffset: number;
  endOffset: number;
};

export type LexicalAlignment = {
  id: string;
  translationTokenIds: string[];
  originalTokenIds: string[];
  note: string | null;
};

export type LexicalVerse = {
  bibleVerseId: number;
  translationVersionId: string;
  translationTextHash: string;
  tokenizationVersion: string;
  originalEditionCode: string;
  translationTokens: TranslationToken[];
  originalTokens: OriginalToken[];
  alignments: LexicalAlignment[];
};

export type LexicalLookup = {
  translationTokens: TranslationToken[];
  originalTokens: OriginalToken[];
  alignments: LexicalAlignment[];
};
