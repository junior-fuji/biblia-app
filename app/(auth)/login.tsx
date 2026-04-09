import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthMode = 'signin' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const { session, initialized } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === 'signin' ? 'Entrar na sua conta' : 'Criar sua conta'),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === 'signin'
        ? 'Acesse seus estudos, preferências e sincronização.'
        : 'Crie uma conta para sincronizar sua experiência entre dispositivos.',
    [mode]
  );

  useEffect(() => {
    if (initialized && session?.user) {
      router.replace('/(tabs)' as any);
    }
  }, [session, initialized, router]);

  function validateFields() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Autenticação', 'Preencha e-mail e senha.');
      return false;
    }

    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Cadastro', 'Preencha seu nome.');
      return false;
    }

    if (password.trim().length < 6) {
      Alert.alert('Autenticação', 'A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    return true;
  }

  async function signIn() {
    if (!validateFields()) return;

    try {
      setSubmitting(true);

      const sb = getSupabaseOrThrow();
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Entrar', e?.message || 'Erro ao entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function signUp() {
    if (!validateFields()) return;

    try {
      setSubmitting(true);

      const sb = getSupabaseOrThrow();
      const { data, error } = await sb.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await sb.from('profiles').upsert(
          {
            id: data.user.id,
            name: name.trim(),
          },
          { onConflict: 'id' }
        );

        if (profileError) {
          console.log('PROFILE_CREATE_ERROR', profileError);
        }
      }

      if (data.session) {
        Alert.alert('Cadastro', 'Conta criada e login realizado com sucesso.');
        router.replace('/(tabs)' as any);
        return;
      }

      Alert.alert(
        'Cadastro',
        'Conta criada. Verifique seu e-mail para confirmar a conta antes de entrar.'
      );
      setMode('signin');
    } catch (e: any) {
      Alert.alert('Cadastro', e?.message || 'Erro ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrimaryAction() {
    if (mode === 'signin') {
      await signIn();
      return;
    }

    await signUp();
  }

  if (!initialized) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Verificando sessão...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>Bíblia + Harpa + IA</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
            onPress={() => setMode('signin')}
            disabled={submitting}
          >
            <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>
              Entrar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
            onPress={() => setMode('signup')}
            disabled={submitting}
          >
            <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'signup' ? (
          <TextInput
            placeholder="Seu nome"
            value={name}
            onChangeText={setName}
            editable={!submitting}
            style={styles.input}
            placeholderTextColor="#8E8E93"
          />
        ) : null}

        <TextInput
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!submitting}
          style={styles.input}
          placeholderTextColor="#8E8E93"
        />

        <TextInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting}
          style={styles.input}
          placeholderTextColor="#8E8E93"
        />

        <TouchableOpacity
          onPress={handlePrimaryAction}
          disabled={submitting}
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))}
          disabled={submitting}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>
            {mode === 'signin'
              ? 'Ainda não tem conta? Criar agora'
              : 'Já tem conta? Entrar'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontWeight: '600',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  brandPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  brandPillText: {
    color: '#007AFF',
    fontWeight: '800',
    fontSize: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },

  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    padding: 4,
    borderRadius: 14,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  modeBtnText: {
    color: '#667085',
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#111827',
  },

  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    color: '#111',
  },

  primaryBtn: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: '#8EC5FF',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },

  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#111',
    fontWeight: '700',
  },
});