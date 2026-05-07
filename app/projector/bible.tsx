import ProjectorScreen from '@/src/services/projector/ProjectorScreen';
import {
    loadBibleProjectorPayload,
    StoredProjectorPayload,
} from '@/src/services/projector/bibleProjector';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BibleProjectorRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deckId?: string | string[] }>();

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<StoredProjectorPayload | null>(null);

  const deckId = useMemo(() => {
    const raw = Array.isArray(params.deckId)
      ? params.deckId[0]
      : params.deckId;

    return raw ? String(raw) : null;
  }, [params.deckId]);

  useEffect(() => {
    let mounted = true;

    async function loadPayload() {
      setLoading(true);

      try {
        if (!deckId) {
          if (mounted) {
            setPayload(null);
          }

          return;
        }

        const loadedPayload = await loadBibleProjectorPayload(deckId);

        if (!mounted) {
          return;
        }

        setPayload(loadedPayload);
      } catch (error) {
        console.log('BIBLE_PROJECTOR_ROUTE_LOAD_ERROR', error);

        if (mounted) {
          setPayload(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadPayload();

    return () => {
      mounted = false;
    };
  }, [deckId]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#AF52DE" />
        <Text style={styles.loadingText}>Carregando projetor...</Text>
      </View>
    );
  }

  if (!payload || payload.slides.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Projetor indisponível</Text>
        <Text style={styles.errorText}>
          Nenhum slide foi encontrado. Volte para a Bíblia e abra o projetor novamente.
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ProjectorScreen
      title={payload.title}
      subtitle={payload.subtitle}
      slides={payload.slides}
      onClose={handleClose}
      pickerLabel="Versículos"
      pickerTitle="Selecionar versículo"
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#AF52DE',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});