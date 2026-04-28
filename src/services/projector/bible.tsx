import type { ProjectorSlide } from '@/src/services/projector/bibleProjector';
import ProjectorScreen from '@/src/services/projector/ProjectorScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const PROJECTOR_STORAGE_KEY = 'BIBLE_PROJECTOR_SLIDES_V1';

type StoredProjectorPayload = {
  title: string;
  subtitle?: string;
  slides: ProjectorSlide[];
};

export default function BibleProjectorRoute() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<StoredProjectorPayload | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSlides() {
      try {
        const key = deckId
          ? `${PROJECTOR_STORAGE_KEY}:${deckId}`
          : PROJECTOR_STORAGE_KEY;

        const raw = await AsyncStorage.getItem(key);

        if (!mounted) return;

        if (!raw) {
          setPayload(null);
          return;
        }

        const parsed = JSON.parse(raw) as StoredProjectorPayload;

        if (!Array.isArray(parsed.slides)) {
          setPayload(null);
          return;
        }

        setPayload(parsed);
      } catch (error) {
        console.log('LOAD_PROJECTOR_ROUTE_ERROR', error);

        if (mounted) {
          setPayload(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSlides();

    return () => {
      mounted = false;
    };
  }, [deckId]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!payload || payload.slides.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text>Nenhum slide encontrado para o projetor.</Text>
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