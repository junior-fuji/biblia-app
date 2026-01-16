import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

// DADOS DOS LIVROS (Para navegação rápida)
const ALL_BOOKS = [
  { id: 1, name: 'Gênesis', abbrev: 'Gn', chapters: 50, test: 'old' },
  { id: 2, name: 'Êxodo', abbrev: 'Ex', chapters: 40, test: 'old' },
  { id: 3, name: 'Levítico', abbrev: 'Lv', chapters: 27, test: 'old' },
  { id: 4, name: 'Números', abbrev: 'Nm', chapters: 36, test: 'old' },
  { id: 5, name: 'Deuteronômio', abbrev: 'Dt', chapters: 34, test: 'old' },
  { id: 6, name: 'Josué', abbrev: 'Js', chapters: 24, test: 'old' },
  { id: 7, name: 'Juízes', abbrev: 'Jz', chapters: 21, test: 'old' },
  { id: 8, name: 'Rute', abbrev: 'Rt', chapters: 4, test: 'old' },
  { id: 9, name: '1 Samuel', abbrev: '1Sm', chapters: 31, test: 'old' },
  { id: 10, name: '2 Samuel', abbrev: '2Sm', chapters: 24, test: 'old' },
  { id: 11, name: '1 Reis', abbrev: '1Rs', chapters: 22, test: 'old' },
  { id: 12, name: '2 Reis', abbrev: '2Rs', chapters: 25, test: 'old' },
  { id: 13, name: '1 Crônicas', abbrev: '1Cr', chapters: 29, test: 'old' },
  { id: 14, name: '2 Crônicas', abbrev: '2Cr', chapters: 36, test: 'old' },
  { id: 15, name: 'Esdras', abbrev: 'Ed', chapters: 10, test: 'old' },
  { id: 16, name: 'Neemias', abbrev: 'Ne', chapters: 13, test: 'old' },
  { id: 17, name: 'Ester', abbrev: 'Et', chapters: 10, test: 'old' },
  { id: 18, name: 'Jó', abbrev: 'Jó', chapters: 42, test: 'old' },
  { id: 19, name: 'Salmos', abbrev: 'Sl', chapters: 150, test: 'old' },
  { id: 20, name: 'Provérbios', abbrev: 'Pv', chapters: 31, test: 'old' },
  { id: 21, name: 'Eclesiastes', abbrev: 'Ec', chapters: 12, test: 'old' },
  { id: 22, name: 'Cânticos', abbrev: 'Ct', chapters: 8, test: 'old' },
  { id: 23, name: 'Isaías', abbrev: 'Is', chapters: 66, test: 'old' },
  { id: 24, name: 'Jeremias', abbrev: 'Jr', chapters: 52, test: 'old' },
  { id: 25, name: 'Lamentações', abbrev: 'Lm', chapters: 5, test: 'old' },
  { id: 26, name: 'Ezequiel', abbrev: 'Ez', chapters: 48, test: 'old' },
  { id: 27, name: 'Daniel', abbrev: 'Dn', chapters: 12, test: 'old' },
  { id: 28, name: 'Oseias', abbrev: 'Os', chapters: 14, test: 'old' },
  { id: 29, name: 'Joel', abbrev: 'Jl', chapters: 3, test: 'old' },
  { id: 30, name: 'Amós', abbrev: 'Am', chapters: 9, test: 'old' },
  { id: 31, name: 'Obadias', abbrev: 'Ob', chapters: 1, test: 'old' },
  { id: 32, name: 'Jonas', abbrev: 'Jn', chapters: 4, test: 'old' },
  { id: 33, name: 'Miqueias', abbrev: 'Mq', chapters: 7, test: 'old' },
  { id: 34, name: 'Naum', abbrev: 'Na', chapters: 3, test: 'old' },
  { id: 35, name: 'Habacuque', abbrev: 'Hc', chapters: 3, test: 'old' },
  { id: 36, name: 'Sofonias', abbrev: 'Sf', chapters: 3, test: 'old' },
  { id: 37, name: 'Ageu', abbrev: 'Ag', chapters: 2, test: 'old' },
  { id: 38, name: 'Zacarias', abbrev: 'Zc', chapters: 14, test: 'old' },
  { id: 39, name: 'Malaquias', abbrev: 'Ml', chapters: 4, test: 'old' },
  { id: 40, name: 'Mateus', abbrev: 'Mt', chapters: 28, test: 'new' },
  { id: 41, name: 'Marcos', abbrev: 'Mc', chapters: 16, test: 'new' },
  { id: 42, name: 'Lucas', abbrev: 'Lc', chapters: 24, test: 'new' },
  { id: 43, name: 'João', abbrev: 'Jo', chapters: 21, test: 'new' },
  { id: 44, name: 'Atos', abbrev: 'At', chapters: 28, test: 'new' },
  { id: 45, name: 'Romanos', abbrev: 'Rm', chapters: 16, test: 'new' },
  { id: 46, name: '1 Coríntios', abbrev: '1Co', chapters: 16, test: 'new' },
  { id: 47, name: '2 Coríntios', abbrev: '2Co', chapters: 13, test: 'new' },
  { id: 48, name: 'Gálatas', abbrev: 'Gl', chapters: 6, test: 'new' },
  { id: 49, name: 'Efésios', abbrev: 'Ef', chapters: 6, test: 'new' },
  { id: 50, name: 'Filipenses', abbrev: 'Fp', chapters: 4, test: 'new' },
  { id: 51, name: 'Colossenses', abbrev: 'Cl', chapters: 4, test: 'new' },
  { id: 52, name: '1 Tessalonicenses', abbrev: '1Ts', chapters: 5, test: 'new' },
  { id: 53, name: '2 Tessalonicenses', abbrev: '2Ts', chapters: 3, test: 'new' },
  { id: 54, name: '1 Timóteo', abbrev: '1Tm', chapters: 6, test: 'new' },
  { id: 55, name: '2 Timóteo', abbrev: '2Tm', chapters: 4, test: 'new' },
  { id: 56, name: 'Tito', abbrev: 'Tt', chapters: 3, test: 'new' },
  { id: 57, name: 'Filemom', abbrev: 'Fm', chapters: 1, test: 'new' },
  { id: 58, name: 'Hebreus', abbrev: 'Hb', chapters: 13, test: 'new' },
  { id: 59, name: 'Tiago', abbrev: 'Tg', chapters: 5, test: 'new' },
  { id: 60, name: '1 Pedro', abbrev: '1Pe', chapters: 5, test: 'new' },
  { id: 61, name: '2 Pedro', abbrev: '2Pe', chapters: 3, test: 'new' },
  { id: 62, name: '1 João', abbrev: '1Jo', chapters: 5, test: 'new' },
  { id: 63, name: '2 João', abbrev: '2Jo', chapters: 1, test: 'new' },
  { id: 64, name: '3 João', abbrev: '3Jo', chapters: 1, test: 'new' },
  { id: 65, name: 'Judas', abbrev: 'Jd', chapters: 1, test: 'new' },
  { id: 66, name: 'Apocalipse', abbrev: 'Ap', chapters: 22, test: 'new' },
];

export default function BibleIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [activeTab, setActiveTab] = useState<'old' | 'new'>('old');
  const [searchText, setSearchText] = useState('');
  
  // ESTADOS DA BUSCA
  const [isSearching, setIsSearching] = useState(false);
  const [verseResults, setVerseResults] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (params.q) {
        performSearch(params.q as string);
    }
  }, [params.q]);

  const performSearch = async (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
        setIsSearching(false);
        setVerseResults([]);
        return;
    }

    setIsSearching(true);
    setLoadingSearch(true);

    // 1. Filtra Livros (Busca simples de nome)
    const booksFound = ALL_BOOKS.filter(b => 
        b.name.toLowerCase().includes(text.toLowerCase()) || 
        b.abbrev.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredBooks(booksFound);

    // 2. Busca Versículos (VOLTAMOS PARA O ILIKE QUE É SEGURO)
    try {
        const { data, error } = await supabase
            .from('verses')
            .select('id, book_id, chapter, verse, text_pt')
            .ilike('text_pt', `%${text}%`) // Busca ampla primeiro
            .limit(100); // Trazemos mais resultados para filtrar depois

        if (!error && data) {
            // 3. FILTRO MANUAL INTELIGENTE (Resolve o Ana vs Banana)
            // Filtramos aqui no celular para garantir que só exibe a palavra exata
            const cleanText = text.toLowerCase().trim();
            
            const exactMatches = data.filter(item => {
                const verseLower = item.text_pt.toLowerCase();
                // Regex: Procura a palavra cercada por espaços ou pontuação
                const regex = new RegExp(`(^|\\W)${cleanText}($|\\W)`);
                return regex.test(verseLower);
            });

            // Se achou correspondências exatas, mostra elas. Se não, mostra a busca ampla.
            setVerseResults(exactMatches.length > 0 ? exactMatches : data);
        }
    } catch (e) {
        console.log("Erro na busca de versículos", e);
    } finally {
        setLoadingSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setIsSearching(false);
    setVerseResults([]);
    router.setParams({ q: '' });
  };

  const openBook = (bookId: number, chapter: number = 1) => {
    router.push({
      pathname: "/read/[book]",
      params: { book: bookId, chapter: chapter }
    });
  };

  const getBookName = (id: number) => {
    const found = ALL_BOOKS.find(b => b.id === id);
    return found ? found.name : 'Livro';
  };

  const renderBookItem = (book: any) => (
    <TouchableOpacity key={book.id} style={styles.bookRow} onPress={() => openBook(book.id)}>
      <View style={styles.bookLeft}>
        <View style={styles.abbrevCircle}>
            <Text style={styles.abbrevText}>{book.abbrev}</Text>
        </View>
        <View>
            <Text style={styles.bookName}>{book.name}</Text>
            <Text style={styles.bookChapters}>{book.chapters} capítulos</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const renderVerseItem = ({ item }: any) => (
    <TouchableOpacity style={styles.verseResultCard} onPress={() => openBook(item.book_id, item.chapter)}>
        <View style={styles.verseResultHeader}>
            <Text style={styles.verseResultRef}>{getBookName(item.book_id)} {item.chapter}:{item.verse}</Text>
            <Ionicons name="arrow-forward-circle" size={20} color="#007AFF" />
        </View>
        <Text style={styles.verseResultText} numberOfLines={3}>{item.text_pt}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bíblia Sagrada</Text>
      </View>

      {/* BARRA DE BUSCA */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 10 }} />
        <TextInput 
            style={styles.searchInput}
            placeholder="Buscar livro ou palavra..."
            placeholderTextColor="#8E8E93"
            value={searchText}
            onChangeText={(t) => performSearch(t)}
            returnKeyType="search"
            autoCapitalize="none"
        />
        {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
        )}
      </View>

      {/* CONTEÚDO */}
      {isSearching && searchText.trim().length > 0 ? (
        // --- MODO RESULTADOS ---
        <ScrollView contentContainerStyle={styles.listContent}>
            
            {/* Resultados de Livros */}
            {filteredBooks.length > 0 && (
                <View>
                    <Text style={styles.resultSectionTitle}>LIVROS ENCONTRADOS</Text>
                    <View style={styles.sectionBlock}>
                        {filteredBooks.map(renderBookItem)}
                    </View>
                </View>
            )}

            {/* Resultados de Versículos */}
            <Text style={styles.resultSectionTitle}>VERSÍCULOS ENCONTRADOS</Text>
            {loadingSearch ? (
                <ActivityIndicator size="small" color="#007AFF" style={{marginTop: 10}} />
            ) : verseResults.length > 0 ? (
                <FlatList
                    data={verseResults}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderVerseItem}
                    scrollEnabled={false}
                />
            ) : (
                <Text style={styles.emptyText}>
                    {filteredBooks.length === 0 ? "Nenhum resultado encontrado." : "Nenhuma correspondência exata."}
                </Text>
            )}
        </ScrollView>

      ) : (
        // --- MODO LISTA DE LIVROS (ABAS) ---
        <>
            <View style={styles.tabsContainer}>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'old' && styles.activeTab]} onPress={() => setActiveTab('old')}>
                    <Text style={[styles.tabText, activeTab === 'old' && styles.activeTabText]}>Antigo Testamento</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'new' && styles.activeTab]} onPress={() => setActiveTab('new')}>
                    <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>Novo Testamento</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionBlock}>
                    {ALL_BOOKS.filter(b => b.test === activeTab).map(renderBookItem)}
                </View>
            </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#000' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5EA', marginHorizontal: 15, marginTop: 15, marginBottom: 10, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 15 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#E5E5EA', marginHorizontal: 2 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  activeTabText: { color: '#007AFF', fontWeight: '700' },

  listContent: { paddingHorizontal: 15, paddingBottom: 100 },
  sectionBlock: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },

  bookRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  bookLeft: { flexDirection: 'row', alignItems: 'center' },
  abbrevCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  abbrevText: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  bookName: { fontSize: 16, fontWeight: '600', color: '#000' },
  bookChapters: { fontSize: 12, color: '#8E8E93' },

  resultSectionTitle: { fontSize: 13, fontWeight: '800', color: '#8E8E93', marginTop: 20, marginBottom: 10, marginLeft: 5 },
  verseResultCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  verseResultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  verseResultRef: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  verseResultText: { fontSize: 15, color: '#333', lineHeight: 22 },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 16, marginTop: 20 }
});