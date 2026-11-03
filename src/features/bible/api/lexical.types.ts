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
  /** Offsets use JavaScript UTF-16 string indices: [startOffset, endOffset). */
  startOffset: number;
  endOffset: number;
};

/**
 * Alignment is intentionally many-to-many.
 * Either side may be empty to represent material with no direct counterpart.
 */
export type LexicalAlignment = {
  id: string;
  translationTokenIds: string[];
  originalTokenIds: string[];
  note: string | null;
};

export type LexicalVerse = {
  /** Exact DB type remains intentionally open until the live Supabase schema is verified. */
  bibleVerseId: string | number;
  translationVersionId: string;
  translationTextHash: string;
  tokenizationVersion: string;
  offsetEncoding: 'utf16-js';
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
