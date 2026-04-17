import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BookItem = {
  id: number;
  name: string;
  abbrev: string;
};

const BOOK_MAP: BookItem[] = [
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
  const [query, setQuery] = useState('');

  const oldTestament = useMemo(() => {
    const list = BOOK_MAP.filter((b) => b.id <= 39);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.abbrev.toLowerCase().includes(q) ||
        String(b.id).includes(q)
    );
  }, [query]);

  const newTestament = useMemo(() => {
    const list = BOOK_MAP.filter((b) => b.id >= 40);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.abbrev.toLowerCase().includes(q) ||
        String(b.id).includes(q)
    );
  }, [query]);

  function openBook(bookId: number) {
    router.push(`/(tabs)/read/${bookId}?chapter=1&returnTo=/(tabs)/read` as any);
  }

  function renderBook({ item }: { item: BookItem }) {
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

  function renderSection(title: string, data: BookItem[]) {
    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBook}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnRow}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum livro encontrado</Text>}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)' as any)}
          style={styles.homeBackBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={18} color="#007AFF" />
          <Text style={styles.homeBackText}>Início</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Ionicons name="book" size={26} color="#007AFF" />
          <Text style={styles.title}>Bíblia Sagrada</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar livro"
          placeholderTextColor="#8E8E93"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={[{ key: 'content' }]}
        keyExtractor={(item) => item.key}
        renderItem={() => (
          <View style={styles.content}>
            {renderSection('ANTIGO TESTAMENTO', oldTestament)}
            {renderSection('NOVO TESTAMENTO', newTestament)}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  homeBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F2F7FF',
    marginBottom: 12,
  },

  homeBackText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
  },

  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginLeft: 10,
  },

  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#111',
    fontSize: 15,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  sectionBlock: {
    marginTop: 8,
  },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 1,
  },

  columnRow: {
    justifyContent: 'space-between',
  },

  bookCard: {
    width: '48.5%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  bookAbbrev: {
    fontSize: 12,
    fontWeight: '900',
    color: '#007AFF',
    marginBottom: 6,
  },

  bookName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },

  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 6,
  },
});