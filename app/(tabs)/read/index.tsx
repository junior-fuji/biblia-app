import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BookItem = {
  id: number;
  name: string;
  abbrev: string;
};

const OLD_TESTAMENT: BookItem[] = [
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
];

const NEW_TESTAMENT: BookItem[] = [
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

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filterBooks = (books: BookItem[]) =>
      !q
        ? books
        : books.filter(
            (book) =>
              book.name.toLowerCase().includes(q) ||
              book.abbrev.toLowerCase().includes(q) ||
              String(book.id).includes(q)
          );

    return [
      { title: 'ANTIGO TESTAMENTO', data: filterBooks(OLD_TESTAMENT) },
      { title: 'NOVO TESTAMENTO', data: filterBooks(NEW_TESTAMENT) },
    ].filter((section) => section.data.length > 0);
  }, [query]);

  const openBook = (book: BookItem) => {
    router.push(`/(tabs)/read/${book.id}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)' as any)}
            style={styles.homeBackBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={18} color="#007AFF" />
            <Text style={styles.homeBackText}>Início</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Ionicons name="book" size={26} color="#007AFF" />
          <Text style={styles.title}>Bíblia Sagrada</Text>
        </View>

        <View style={styles.headerRight} />
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

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookCard}
            activeOpacity={0.85}
            onPress={() => openBook(item)}
          >
            <View style={styles.bookBadge}>
              <Text style={styles.bookBadgeText}>{item.abbrev}</Text>
            </View>

            <View style={styles.bookInfo}>
              <Text style={styles.bookName}>{item.name}</Text>
              <Text style={styles.bookMeta}>Livro {item.id}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={28} color="#B0B0B0" />
            <Text style={styles.emptyText}>Nenhum livro encontrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },

  headerLeft: {
    minWidth: 92,
  },

  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  headerRight: {
    minWidth: 92,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginLeft: 10,
  },

  homeBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFFCC',
  },

  homeBackText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
  },

  searchWrap: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#111',
    fontSize: 15,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7280',
    marginTop: 14,
    marginBottom: 10,
    letterSpacing: 0.8,
  },

  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  bookBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  bookBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },

  bookInfo: {
    flex: 1,
  },

  bookName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },

  bookMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
});