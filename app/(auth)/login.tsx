import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Login() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session?.user) {
      router.replace('/(tabs)' as any);
    }
  }, [session, loading, router]);

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Login', 'Preencha e-mail e senha.');
      return;
    }

    try {
      setSubmitting(true);

      const sb = getSupabaseOrThrow();
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }
    } catch (e: any) {
      Alert.alert('Login', e?.message || 'Erro ao entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function signUp() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Cadastro', 'Preencha e-mail e senha.');
      return;
    }

    try {
      setSubmitting(true);

      const sb = getSupabaseOrThrow();
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        Alert.alert('Cadastro', 'Conta criada e login realizado com sucesso.');
      } else {
        Alert.alert(
          'Cadastro',
          'Conta criada. Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.'
        );
      }
    } catch (e: any) {
      Alert.alert('Cadastro', e?.message || 'Erro ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: '#F2F2F7',
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12, color: '#666', fontWeight: '600' }}>
          Verificando sessão...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#F2F2F7',
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#111' }}>Entrar</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        editable={!submitting}
        style={{
          backgroundColor: '#fff',
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E5EA',
        }}
      />

      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!submitting}
        style={{
          backgroundColor: '#fff',
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E5EA',
        }}
      />

      <TouchableOpacity
        onPress={signIn}
        disabled={submitting}
        style={{
          backgroundColor: submitting ? '#8EC5FF' : '#007AFF',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>
            Entrar
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={signUp}
        disabled={submitting}
        style={{
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#ddd',
          backgroundColor: '#fff',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontWeight: '800', textAlign: 'center', color: '#111' }}>
          Criar conta
        </Text>
      </TouchableOpacity>
    </View>
  );
}