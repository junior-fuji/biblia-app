import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OptionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  isDestructive?: boolean;
  onPress?: () => void;
  rightText?: string;
};

const SETTINGS_KEYS = {
  darkMode: 'APP_SETTINGS_DARK_MODE',
  notifications: 'APP_SETTINGS_NOTIFICATIONS',
  bibleVersion: 'APP_SETTINGS_BIBLE_VERSION',
  fontSize: 'APP_SETTINGS_FONT_SIZE',
};

function timeoutAfter(ms: number) {
  return new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('Tempo esgotado ao salvar perfil. Verifique conexão e permissões.'));
    }, ms);
  });
}

function OptionRow({
  icon,
  color,
  label,
  value,
  onToggle,
  isDestructive,
  onPress,
  rightText,
}: OptionRowProps) {
  const hasToggle = typeof value === 'boolean' && !!onToggle;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={hasToggle ? undefined : onPress}
      activeOpacity={hasToggle ? 1 : 0.85}
    >
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>

      <Text style={[styles.rowLabel, isDestructive && { color: '#FF3B30' }]}>
        {label}
      </Text>

      {hasToggle ? (
        <Switch value={value} onValueChange={onToggle} />
      ) : rightText ? (
        <Text style={styles.rightText}>{rightText}</Text>
      ) : !isDestructive ? (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { session, loading, refreshSession } = useAuth();

  const [profileName, setProfileName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const [versionModal, setVersionModal] = useState(false);
  const [fontModal, setFontModal] = useState(false);

  const [editNameModal, setEditNameModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const versions = useMemo(() => ['NVI', 'ARA', 'ACF', 'ARC', 'KJA'], []);
  const [bibleVersion, setBibleVersion] = useState('NVI');

  const fontSizes = useMemo(
    () => [
      { label: 'Pequena', value: 14 },
      { label: 'Média', value: 16 },
      { label: 'Grande', value: 18 },
      { label: 'Extra', value: 20 },
    ],
    []
  );
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const sb = getSupabaseOrNull();
      const userId = session?.user?.id;

      if (!sb || !userId) {
        setProfileName('');
        return;
      }

      try {
        const result = await Promise.race([
          sb.from('profiles').select('name').eq('id', userId).maybeSingle(),
          timeoutAfter(10000),
        ]);

        if (!mounted) return;

        const { data, error } = result as any;

        if (error) {
          console.log('LOAD_PROFILE_SETTINGS_ERROR', error);
          setProfileName('');
          return;
        }

        setProfileName(String(data?.name ?? '').trim());
      } catch (e) {
        if (!mounted) return;
        console.log('LOAD_PROFILE_SETTINGS_FATAL', e);
        setProfileName('');
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEYS.darkMode, JSON.stringify(darkMode)).catch(() => {});
  }, [darkMode]);

  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEYS.notifications, JSON.stringify(notifications)).catch(() => {});
  }, [notifications]);

  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEYS.bibleVersion, bibleVersion).catch(() => {});
  }, [bibleVersion]);

  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEYS.fontSize, String(fontSize)).catch(() => {});
  }, [fontSize]);

  async function loadSettings() {
    try {
      const [darkModeRaw, notificationsRaw, bibleVersionRaw, fontSizeRaw] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.darkMode),
        AsyncStorage.getItem(SETTINGS_KEYS.notifications),
        AsyncStorage.getItem(SETTINGS_KEYS.bibleVersion),
        AsyncStorage.getItem(SETTINGS_KEYS.fontSize),
      ]);

      if (darkModeRaw != null) setDarkMode(JSON.parse(darkModeRaw));
      if (notificationsRaw != null) setNotifications(JSON.parse(notificationsRaw));
      if (bibleVersionRaw) setBibleVersion(bibleVersionRaw);

      if (fontSizeRaw) {
        const parsed = Number(fontSizeRaw);
        if (Number.isFinite(parsed)) setFontSize(parsed);
      }
    } catch (e) {
      console.log('LOAD_SETTINGS_ERROR', e);
    }
  }

  async function handleLogout() {
    try {
      const sb = getSupabaseOrNull();

      if (!sb) {
        Alert.alert('Conta', 'Supabase indisponível neste build.');
        return;
      }

      const { error } = await sb.auth.signOut();
      if (error) throw error;

      await refreshSession();
      Alert.alert('Conta', 'Você saiu da conta com sucesso.');
      router.replace('/login' as any);
    } catch (e: any) {
      Alert.alert('Conta', e?.message || 'Não foi possível sair da conta.');
    }
  }

  async function handleSaveName() {
    if (!session?.user) {
      Alert.alert('Perfil', 'Faça login para editar o perfil.');
      return;
    }

    const nextName = editName.trim();

    if (!nextName) {
      Alert.alert('Perfil', 'Digite um nome válido.');
      return;
    }

    try {
      setSavingName(true);

      const sb = getSupabaseOrNull();
      if (!sb) throw new Error('Supabase indisponível');

      const updateResult = await Promise.race([
        sb
          .from('profiles')
          .update({ name: nextName })
          .eq('id', session.user.id)
          .select('id')
          .maybeSingle(),
        timeoutAfter(12000),
      ]);

      const { data: updatedData, error: updateError } = updateResult as any;

      if (updateError) {
        throw updateError;
      }

      if (!updatedData) {
        const insertResult = await Promise.race([
          sb
            .from('profiles')
            .insert({
              id: session.user.id,
              name: nextName,
            })
            .select('id')
            .maybeSingle(),
          timeoutAfter(12000),
        ]);

        const { error: insertError } = insertResult as any;

        if (insertError) {
          throw insertError;
        }
      }

      setProfileName(nextName);
      setEditNameModal(false);
      Alert.alert('Perfil', 'Nome atualizado com sucesso.');
    } catch (e: any) {
      console.log('SAVE_PROFILE_NAME_ERROR', e);
      Alert.alert('Erro', e?.message || 'Erro ao atualizar nome.');
    } finally {
      setSavingName(false);
    }
  }

  const userEmail = session?.user?.email || 'Não autenticado';
  const displayName = profileName || session?.user?.email?.split('@')[0] || 'Usuário';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Ajustes</Text>

        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>
            {loading ? 'Verificando sessão...' : userEmail}
          </Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => {
              if (!session?.user) {
                Alert.alert('Conta', 'Faça login para editar seu perfil.');
                return;
              }

              setEditName(profileName || '');
              setEditNameModal(true);
            }}
          >
            <Text style={styles.editProfileText}>
              {session?.user ? 'Editar Perfil' : 'Entrar na conta'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>GERAL</Text>
        <View style={styles.section}>
          <OptionRow
            icon="moon"
            color="#5856D6"
            label="Modo Escuro"
            value={darkMode}
            onToggle={setDarkMode}
          />
          <View style={styles.divider} />
          <OptionRow
            icon="notifications"
            color="#FF3B30"
            label="Notificações"
            value={notifications}
            onToggle={setNotifications}
          />
        </View>

        <Text style={styles.sectionTitle}>CONTEÚDO</Text>
        <View style={styles.section}>
          <OptionRow
            icon="book"
            color="#007AFF"
            label="Versão da Bíblia"
            rightText={bibleVersion}
            onPress={() => setVersionModal(true)}
          />
          <View style={styles.divider} />
          <OptionRow
            icon="text"
            color="#34C759"
            label="Tamanho da Fonte"
            rightText={`${fontSize}`}
            onPress={() => setFontModal(true)}
          />
          <View style={styles.divider} />
          <OptionRow
            icon="tv"
            color="#111827"
            label="Modo Projetor"
            onPress={() =>
              Alert.alert(
                'Modo Projetor',
                'O projetor já funciona nas telas suportadas da web. Depois podemos centralizar preferências avançadas aqui.'
              )
            }
          />
        </View>

        <Text style={styles.sectionTitle}>CONTA</Text>
        <View style={styles.section}>
          {!session?.user ? (
            <>
              <OptionRow
                icon="log-in"
                color="#007AFF"
                label="Entrar / Criar conta"
                onPress={() => router.push('/login' as any)}
              />
              <View style={styles.divider} />
            </>
          ) : null}

          <OptionRow
            icon="help-circle"
            color="#8E8E93"
            label="Ajuda e Suporte"
            onPress={() => Alert.alert('Contato', 'Suporte via WhatsApp (definir).')}
          />

          {session?.user ? (
            <>
              <View style={styles.divider} />
              <OptionRow
                icon="log-out"
                color="#FF3B30"
                label="Sair da Conta"
                isDestructive
                onPress={handleLogout}
              />
            </>
          ) : null}
        </View>

        <Text style={styles.version}>Versão 1.0.0 (Beta)</Text>
      </ScrollView>

      <Modal visible={versionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Versão da Bíblia</Text>

            {versions.map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.modalItem}
                onPress={() => {
                  setBibleVersion(v);
                  setVersionModal(false);
                }}
              >
                <Text style={[styles.modalItemText, v === bibleVersion && { color: '#007AFF' }]}>
                  {v}
                </Text>
                {v === bibleVersion ? (
                  <Ionicons name="checkmark" size={18} color="#007AFF" />
                ) : null}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalClose} onPress={() => setVersionModal(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={fontModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tamanho da Fonte</Text>

            {fontSizes.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={styles.modalItem}
                onPress={() => {
                  setFontSize(f.value);
                  setFontModal(false);
                }}
              >
                <Text style={[styles.modalItemText, f.value === fontSize && { color: '#007AFF' }]}>
                  {f.label} ({f.value})
                </Text>
                {f.value === fontSize ? (
                  <Ionicons name="checkmark" size={18} color="#007AFF" />
                ) : null}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalClose} onPress={() => setFontModal(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editNameModal} transparent animationType="fade" onRequestClose={() => setEditNameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar nome</Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome"
              style={styles.inputInline}
              placeholderTextColor="#8E8E93"
              editable={!savingName}
            />

            <TouchableOpacity
              onPress={handleSaveName}
              disabled={savingName}
              style={styles.primaryActionBtn}
            >
              {savingName ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryActionBtnText}>Salvar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => !savingName && setEditNameModal(false)}
              style={styles.secondaryActionBtn}
              disabled={savingName}
            >
              <Text style={styles.secondaryActionBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -5 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { paddingBottom: 40 },

  profileSection: { alignItems: 'center', marginVertical: 30 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileName: { fontSize: 24, fontWeight: '800', color: '#000' },
  profileRole: { fontSize: 13, color: '#8E8E93', marginBottom: 10 },
  editProfileBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
  },
  editProfileText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 20,
    marginBottom: 5,
    marginTop: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rowLabel: { flex: 1, fontSize: 16, color: '#000' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginLeft: 57 },
  rightText: { color: '#8E8E93', fontWeight: '700' },

  version: { textAlign: 'center', color: '#C7C7CC', marginTop: 30, fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalItemText: { fontSize: 16, fontWeight: '700', color: '#111' },
  modalClose: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontWeight: '800' },

  inputInline: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    lineHeight: 24,
  },

  primaryActionBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontWeight: '800',
  },

  secondaryActionBtn: {
    marginTop: 10,
    alignItems: 'center',
  },
  secondaryActionBtnText: {
    color: '#666',
  },
});