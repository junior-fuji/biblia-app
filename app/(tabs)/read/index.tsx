import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// -----------------------------------------------------------------------------
// 📚 MAPA DOS 66 LIVROS
// -----------------------------------------------------------------------------
const BOOK_MAP = [
  { id: 1, name: 'Gênesis', abbrev: 'Gn' },
  { id: 2, name: 'Êxodo', abbrev: 'Êx' },
  { id: 3, name: 'Levítico', abbrev: 'Lv' },
  { id: 4, name: 'Números', abbrev: 'Nm' },
  { id: 5, name: 'Deuteronômio', abbrev: 'Dt' },
  { id: 6, name: 'Josué', abbrev: 'Js' },
  { id: 7, name: 'Juízes', abbrev: 'Jz' },
  { id: 8, name: 'Rute', abbrev: 'Rt' },
  { id: 9, name: '1 Samuel', abbrev: '1Sm' },
  { id: 10, name: '2 Samuel', abbrev: '2Sm' },
  { id: 11, name: '1 Reis', abbrev: '1Rs' },
  { id: 12, name: '2 Reis', abbrev: '2Rs' },
  { id: 13, name: '1 Crônicas', abbrev: '1Cr' },
  { id: 14, name: '2 Crônicas', abbrev: '2Cr' },
  { id: 15, name: 'Esdras', abbrev: 'Ed' },
  { id: 16, name: 'Neemias', abbrev: 'Ne' },
  { id: 17, name: 'Ester', abbrev: 'Et' },
  { id: 18, name: 'Jó', abbrev: 'Jó' },
  { id: 19, name: 'Salmos', abbrev: 'Sl' },
  { id: 20, name: 'Provérbios', abbrev: 'Pv' },
  { id: 21, name: 'Eclesiastes', abbrev: 'Ec' },
  { id: 22, name: 'Cânticos', abbrev: 'Ct' },
  { id: 23, name: 'Isaías', abbrev: 'Is' },
  { id: 24, name: 'Jeremias', abbrev: 'Jr' },
  { id: 25, name: 'Lamentações', abbrev: 'Lm' },
  { id: 26, name: 'Ezequiel', abbrev: 'Ez' },
  { id: 27, name: 'Daniel', abbrev: 'Dn' },
  { id: 28, name: 'Oseias', abbrev: 'Os' },
  { id: 29, name: 'Joel', abbrev: 'Jl' },
  { id: 30, name: 'Amós', abbrev: 'Am' },
  { id: 31, name: 'Obadias', abbrev: 'Ob' },
  { id: 32, name: 'Jonas', abbrev: 'Jn' },
  { id: 33, name: 'Miqueias', abbrev: 'Mq' },
  { id: 34, name: 'Naum', abbrev: 'Na' },
  { id: 35, name: 'Habacuque', abbrev: 'Hc' },
  { id: 36, name: 'Sofonias', abbrev: 'Sf' },
  { id: 37, name: 'Ageu', abbrev: 'Ag' },
  { id: 38, name: 'Zacarias', abbrev: 'Zc' },
  { id: 39, name: 'Malaquias', abbrev: 'Ml' },
  { id: 40, name: 'Mateus', abbrev: 'Mt' },
  { id: 41, name: 'Marcos', abbrev: 'Mc' },
  { id: 42, name: 'Lucas', abbrev: 'Lc' },
  { id: 43, name: 'João', abbrev: 'Jo' },
  { id: 44, name: 'Atos', abbrev: 'At' },
  { id: 45, name: 'Romanos', abbrev: 'Rm' },
  { id: 46, name: '1 Coríntios', abbrev: '1Co' },
  { id: 47, name: '2 Coríntios', abbrev: '2Co' },
  { id: 48, name: 'Gálatas', abbrev: 'Gl' },
  { id: 49, name: 'Efésios', abbrev: 'Ef' },
  { id: 50, name: 'Filipenses', abbrev: 'Fp' },
  { id: 51, name: 'Colossenses', abbrev: 'Cl' },
  { id: 52, name: '1 Tessalonicenses', abbrev: '1Ts' },
  { id: 53, name: '2 Tessalonicenses', abbrev: '2Ts' },
  { id: 54, name: '1 Timóteo', abbrev: '1Tm' },
  { id: 55, name: '2 Timóteo', abbrev: '2Tm' },
  { id: 56, name: 'Tito', abbrev: 'Tt' },
  { id: 57, name: 'Filemom', abbrev: 'Fm' },
  { id: 58, name: 'Hebreus', abbrev: 'Hb' },
  { id: 59, name: 'Tiago', abbrev: 'Tg' },
  { id: 60, name: '1 Pedro', abbrev: '1Pe' },
  { id: 61, name: '2 Pedro', abbrev: '2Pe' },
  { id: 62, name: '1 João', abbrev: '1Jo' },
  { id: 63, name: '2 João', abbrev: '2Jo' },
  { id: 64, name: '3 João', abbrev: '3Jo' },
  { id: 65, name: 'Judas', abbrev: 'Jd' },
  { id: 66, name: 'Apocalipse', abbrev: 'Ap' },
];

export default function ReadIndexScreen() {
  const router = useRouter();

  function openBook(bookId: number) {
    router.push(`/read/${bookId}?chapter=1`);
  }

  const OLD_TESTAMENT = useMemo(
    () => BOOK_MAP.filter((b) => b.id <= 39),
    []
  );

  const NEW_TESTAMENT = useMemo(
    () => BOOK_MAP.filter((b) => b.id >= 40),
    []
  );

  function renderBook({ item }: { item: typeof BOOK_MAP[0] }) {
    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => openBook(item.id)}
        activeOpacity={0.85}
      >
        <Text style={styles.bookAbbrev}>{item.abbrev}</Text>
        <Text style={styles.bookName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderSection(title: string, data: typeof BOOK_MAP) {
    return (
      <>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBook}
          numColumns={2}
          scrollEnabled={false}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book" size={26} color="#007AFF" />
        <Text style={styles.title}>Bíblia Sagrada</Text>
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <View style={styles.content}>
            {renderSection('ANTIGO TESTAMENTO', OLD_TESTAMENT)}
            {renderSection('NOVO TESTAMENTO', NEW_TESTAMENT)}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1,
  },

  bookCard: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    margin: 6,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookAbbrev: {
    fontSize: 18,
    fontWeight: '900',
    color: '#007AFF',
  },

  bookName: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
  },
});