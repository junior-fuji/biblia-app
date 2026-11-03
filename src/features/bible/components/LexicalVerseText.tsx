import React, { Fragment } from 'react';
import { Pressable, StyleSheet, Text, type TextStyle, type StyleProp } from 'react-native';
import { getLexicalLookupForTranslationToken } from '../api/lexical';
import type { LexicalLookup, LexicalVerse } from '../api/lexical.types';

type Props = {
  text: string;
  lexicalVerse: LexicalVerse | null;
  onLexicalPress: (lookup: LexicalLookup) => void;
  style?: StyleProp<TextStyle>;
};

/**
 * Renderiza somente os trechos que possuem cobertura lexical como interativos.
 * O texto-base continua sendo a fonte visual; offsets seguem índices UTF-16 do JS.
 */
export function LexicalVerseText({ text, lexicalVerse, onLexicalPress, style }: Props) {
  if (!lexicalVerse || lexicalVerse.translationTokens.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  const tokens = [...lexicalVerse.translationTokens].sort((a, b) => a.startOffset - b.startOffset);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  tokens.forEach((token) => {
    if (token.startOffset > cursor) {
      parts.push(<Fragment key={`plain-${cursor}`}>{text.slice(cursor, token.startOffset)}</Fragment>);
    }

    const rendered = text.slice(token.startOffset, token.endOffset);
    const lookup = getLexicalLookupForTranslationToken(lexicalVerse, token.id);

    if (lookup) {
      parts.push(
        <Pressable key={token.id} onPress={() => onLexicalPress(lookup)}>
          <Text style={[style, styles.lexical]}>{rendered}</Text>
        </Pressable>,
      );
    } else {
      parts.push(<Fragment key={token.id}>{rendered}</Fragment>);
    }

    cursor = Math.max(cursor, token.endOffset);
  });

  if (cursor < text.length) parts.push(<Fragment key="plain-end">{text.slice(cursor)}</Fragment>);

  return <Text style={style}>{parts}</Text>;
}

const styles = StyleSheet.create({
  lexical: {
    textDecorationLine: 'underline',
  },
});
