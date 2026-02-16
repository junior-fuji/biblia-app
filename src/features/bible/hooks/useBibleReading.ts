import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
// ⚠️ IMPORTANTE: Ajuste o caminho abaixo para onde está seu arquivo 'lib/supabase.ts'
// Se der erro, tente: '../../../../lib/supabase' ou '@/lib/supabase'
import { getSupabaseOrThrow } from '@/lib/supabaseClient';

export type Verse = { 
    id: string; 
    verse: number; 
    text_pt: string 
};

export function useBibleReading(bookId: string | string[], initialChapter: number = 1) {
    const [loading, setLoading] = useState(true);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [totalChapters, setTotalChapters] = useState(0);
    const [currentChapter, setCurrentChapter] = useState(initialChapter);
    const supabase = getSupabaseOrThrow();

    // Converte o bookId (que vem da rota como string ou array) para número
    const numericBookId = parseInt(Array.isArray(bookId) ? bookId[0] : bookId || '1');

    // 1. Descobrir quantos capítulos o livro tem (Metadados)
    useEffect(() => {
        async function fetchMetadata() {
            try {
                const { data } = await supabase
                    .from('verses')
                    .select('chapter')
                    .eq('book_id', numericBookId)
                    .order('chapter', { ascending: false })
                    .limit(1);

                if (data && data.length > 0) {
                    setTotalChapters(data[0].chapter);
                }
            } catch (e) {
                console.error("Erro ao buscar metadados do livro", e);
            }
        }
        fetchMetadata();
    }, [numericBookId]);

    // 2. Buscar os versículos do capítulo atual
    useEffect(() => {
        let isMounted = true;

        async function fetchVerses() {
            setLoading(true);
            const { data, error } = await supabase
                .from('verses')
                .select('id, verse, text_pt')
                .eq('book_id', numericBookId)
                .eq('chapter', currentChapter)
                .order('verse', { ascending: true });

            if (error) {
                console.error(error);
                Alert.alert("Erro", "Falha ao carregar as escrituras sagradas.");
            } else if (isMounted) {
                setVerses(data || []);
            }
            setLoading(false);
        }

        fetchVerses();

        return () => { isMounted = false; };
    }, [numericBookId, currentChapter]);

    // Funções de Navegação
    const nextChapter = () => {
        if (currentChapter < totalChapters) setCurrentChapter(c => c + 1);
    };

    const prevChapter = () => {
        if (currentChapter > 1) setCurrentChapter(c => c - 1);
    };

    return {
        verses,
        loading,
        currentChapter,
        totalChapters,
        setChapter: setCurrentChapter,
        nextChapter,
        prevChapter
    };
}