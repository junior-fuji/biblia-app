import type {
  LexicalAlignment,
  LexicalLookup,
  LexicalVerse,
  TranslationToken,
} from './lexical.types';

export function hasLexicalCoverage(verse: LexicalVerse | null | undefined): verse is LexicalVerse {
  return Boolean(
    verse &&
      verse.translationTokens.length > 0 &&
      verse.originalTokens.length > 0 &&
      verse.alignments.length > 0,
  );
}

export function findTranslationTokenAtOffset(
  tokens: TranslationToken[],
  offset: number,
): TranslationToken | null {
  return (
    tokens.find((token) => offset >= token.startOffset && offset < token.endOffset) ?? null
  );
}

export function getLexicalLookupForTranslationToken(
  verse: LexicalVerse,
  translationTokenId: string,
): LexicalLookup | null {
  const alignments: LexicalAlignment[] = verse.alignments.filter((alignment) =>
    alignment.translationTokenIds.includes(translationTokenId),
  );

  if (alignments.length === 0) return null;

  const translationIds = new Set(alignments.flatMap((alignment) => alignment.translationTokenIds));
  const originalIds = new Set(alignments.flatMap((alignment) => alignment.originalTokenIds));

  return {
    translationTokens: verse.translationTokens.filter((token) => translationIds.has(token.id)),
    originalTokens: verse.originalTokens.filter((token) => originalIds.has(token.id)),
    alignments,
  };
}
