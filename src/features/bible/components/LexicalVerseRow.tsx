import React from 'react';
import { StyleSheet, Text, TouchableOpacity, type StyleProp, type TextStyle } from 'react-native';
import type { LexicalLookup, LexicalVerse } from '../api/lexical.types';
import { LexicalVerseText } from './LexicalVerseText';

type Props = {
  verseNumber: number;
  text: string;
  lexicalVerse: LexicalVerse | null;
  onLongPress: () => void;
  onLexicalPress: (lookup: LexicalLookup) => void;
  textStyle?: StyleProp<TextStyle>;
  verseNumberStyle?: StyleProp<TextStyle>;
};

/**
 * Fronteira de integração entre o leitor atual e a camada lexical.
 *
 * - long press continua pertencendo ao versículo inteiro (análise por IA);
 * - tap simples só tem ação nos trechos com cobertura lexical;
 * - sem cobertura, o texto permanece visual e funcionalmente equivalente ao leitor atual.
 *
 * A convivência entre o long press do TouchableOpacity e o onPress dos Text
 * lexicais ainda precisa de teste real em iOS/Android/web antes de produção.
 */
export function LexicalVerseRow({
  verseNumber,
  text,
  lexicalVerse,
  onLongPress,
  onLexicalPress,
  textStyle,
  verseNumberStyle,
}: Props) {
  return (
    <TouchableOpacity activeOpacity={0.9} onLongPress={onLongPress}>
      <Text style={[styles.verse, textStyle]}>
        <Text style={[styles.verseNumber, verseNumberStyle]}>
          {verseNumber}{' '}
        </Text>
        <LexicalVerseText
          text={text}
          lexicalVerse={lexicalVerse}
          onLexicalPress={onLexicalPress}
          style={textStyle}
        />
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  verse: { marginBottom: 14 },
  verseNumber: { fontWeight: '900' },
});
