import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function StudiesScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const sb = getSupabaseOrNull();
      if (!sb) {
        setError('Supabase não configurado');
        setLoading(false);
        return;
      }

      const userId = session?.user?.id;

      if (!userId) {
        setError('Faça login para ver seus estudos');
        setLoading(false);
        return;
      }

      const { data, error } = await sb
        .from('saved_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('STUDIES_ERROR', error);
        setError(error.message);
      } else {
        setNotes(data || []);
      }

      setLoading(false);
    }

    load();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error}</Text>

        {!session?.user && (
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={{ color: 'blue', marginTop: 10 }}>Ir para login</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Nenhum estudo salvo ainda</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={{ marginBottom: 12, backgroundColor: '#fff', padding: 12, borderRadius: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
          <Text>{item.reference}</Text>
          <Text numberOfLines={3}>{item.content}</Text>
        </View>
      )}
    />
  );
}