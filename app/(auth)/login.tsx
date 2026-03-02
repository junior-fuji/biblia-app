import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Se já estiver logado, vai direto pras tabs
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  async function signIn() {
    try {
      const sb = getSupabaseOrThrow();

      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // NÃO precisa navegar aqui
      // AuthProvider vai detectar e o useEffect acima redireciona
    } catch (e: any) {
      Alert.alert('Login', e?.message || 'Erro ao entrar');
    }
  }

  async function signUp() {
    try {
      const sb = getSupabaseOrThrow();
      const { error } = await sb.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      Alert.alert('Cadastro', 'Conta criada. Verifique seu e-mail.');
    } catch (e: any) {
      Alert.alert('Cadastro', e?.message || 'Erro ao cadastrar');
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '800' }}>Entrar</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ backgroundColor: '#fff', padding: 14, borderRadius: 12 }}
      />

      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ backgroundColor: '#fff', padding: 14, borderRadius: 12 }}
      />

      <TouchableOpacity
        onPress={signIn}
        style={{ backgroundColor: '#007AFF', padding: 14, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>
          Entrar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={signUp}
        style={{
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#ddd',
        }}
      >
        <Text style={{ fontWeight: '800', textAlign: 'center' }}>
          Criar conta
        </Text>
      </TouchableOpacity>
    </View>
  );
}