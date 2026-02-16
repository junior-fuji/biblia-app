import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';


type Event = {
  id: number;
  title: string;
  description: string | null;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadEvent();
  }, [id]);

  async function loadEvent() {
    setLoading(true);

    const sb = getSupabaseOrThrow();
    const { data, error } = await sb .from('events')
    .select('id, title, description')
      .eq('id', Number(id))
      .single();

    if (error) {
      console.error('Erro ao carregar evento:', error.message);
    } else {
      setEvent(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Evento não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{event.title}</Text>

      {event.description ? (
        <Text style={styles.description}>{event.description}</Text>
      ) : (
        <Text style={styles.muted}>Sem descrição.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  muted: {
    fontSize: 14,
    color: '#888',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});
