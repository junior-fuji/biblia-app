import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LexicalLookup } from '../api/lexical.types';

type Props = {
  visible: boolean;
  lookup: LexicalLookup | null;
  onClose: () => void;
};

export function LexicalWordSheet({ visible, lookup, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Texto original</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar detalhes lexicais">
            <Text style={styles.close}>Fechar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {(lookup?.originalTokens ?? []).map((token) => (
            <View key={token.id} style={styles.tokenCard}>
              <Text style={styles.original}>{token.surface}</Text>
              {token.lemma?.transliteration ? <Text style={styles.transliteration}>{token.lemma.transliteration}</Text> : null}
              {token.lemma?.lemma ? <Row label="Lemma" value={token.lemma.lemma} /> : null}
              {token.lemma?.gloss ? <Row label="Sentido lexical" value={token.lemma.gloss} /> : null}
              {token.morphology ? <Row label="Morfologia" value={token.morphology} /> : null}
              {token.lemma?.identifiers.map((identifier) => (
                <Row key={`${identifier.scheme}:${identifier.value}`} label={identifier.scheme === 'strong' ? 'Strong' : identifier.scheme} value={identifier.value} />
              ))}

              {token.components.length > 0 ? (
                <View style={styles.components}>
                  <Text style={styles.sectionLabel}>Componentes</Text>
                  {token.components.map((component) => (
                    <Text key={component.id} style={styles.componentText}>
                      {component.surface}{component.morphology ? ` — ${component.morphology}` : ''}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          {(lookup?.alignments ?? []).map((alignment) =>
            alignment.note ? <Text key={alignment.id} style={styles.note}>{alignment.note}</Text> : null,
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '72%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#bbb', alignSelf: 'center', marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  close: { fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 28, gap: 14 },
  tokenCard: { paddingVertical: 10, gap: 5 },
  original: { fontSize: 30, fontWeight: '600', textAlign: 'center' },
  transliteration: { fontSize: 15, textAlign: 'center', opacity: 0.7, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 3 },
  label: { width: 105, fontWeight: '600' },
  value: { flex: 1 },
  components: { marginTop: 8, gap: 4 },
  sectionLabel: { fontWeight: '700' },
  componentText: { fontSize: 14 },
  note: { fontSize: 13, opacity: 0.7, fontStyle: 'italic' },
});
