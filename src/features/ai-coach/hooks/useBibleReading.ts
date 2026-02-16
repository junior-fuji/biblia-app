import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
// ⚠️ Ajuste este import se necessário
import { getSupabaseOrThrow } from '@/lib/supabaseClient';

const supabase = getSupabaseOrThrow();

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

    const numericBookId = parseInt(Array.isArray(bookId) ? bookId[0] : bookId || '1');

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
                console.error("Erro ao buscar metadados", e);
            }
        }
        fetchMetadata();
    }, [numericBookId]);

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
                Alert.alert("Erro", "Falha ao carregar as escrituras.");
            } else if (isMounted) {
                setVerses(data || []);
            }
            setLoading(false);
        }
        fetchVerses();
        return () => { isMounted = false; };
    }, [numericBookId, currentChapter]);

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