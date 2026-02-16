import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './providers/AuthProvider';

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  updated_at: string | null;
};
export default function SettingsScreen() {
  const supabase = getSupabaseOrThrow(); // aqui dentro OK



  const router = useRouter();
  const { session, loading } = useAuth();

  // Estados de Configuração
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Estados do Perfil (Supabase)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [hasSession, setHasSession] = useState(false);

  // Avatar (local)
  const [avatar, setAvatar] = useState<string | null>(null);

  // Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [tempFullName, setTempFullName] = useState('');
  const [tempUsername, setTempUsername] = useState('');

  // Loading
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvatar();
    loadProfileFromSupabase();
  }, []);
  useEffect(() => {
    let mounted = true;
  
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        // opcional: setHasSession(!!data.session);
      } catch {}
    };
    
  
    checkSession();
  
    return () => {
      mounted = false;
    };
  }, []);
  
  const loadAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('user_avatar');
      if (savedAvatar) setAvatar(savedAvatar);
    } catch {}
  };

  const loadProfileFromSupabase = async () => {
    setProfileLoading(true);
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        setHasSession(false);
        setFullName('');
        setUsername('');
        return;
      }
      
      setHasSession(true);
      
if (!userId) {
  setFullName('');
  setUsername('');
  // opcional: mandar pro login se você tiver essa rota
  // router.replace('/');
  return;
}

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, updated_at')
        .eq('id', userId)
        .maybeSingle<ProfileRow>();

      if (error) throw error;

      setFullName((data?.full_name ?? '').toString());
      setUsername((data?.username ?? '').toString());
    } catch (e: any) {
      console.error('Erro ao carregar perfil:', e);
      Alert.alert('Erro', e?.message || 'Falha ao carregar perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await AsyncStorage.setItem('user_avatar', uri);
    }
  };

  
  const openEditModal = () => {
    if (!hasSession) {
      Alert.alert('Login necessário', 'Faça login para editar seu perfil.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
      return;
    }
    setTempFullName(fullName);
    setTempUsername(username);
    setIsEditing(true);
  };
  

  const validateProfile = () => {
    const fn = (tempFullName || '').trim();
    const un = (tempUsername || '').trim();

    if (fn.length < 2) {
      Alert.alert('Validação', 'O nome precisa ter pelo menos 2 caracteres.');
      return false;
    }

    if (un.length < 3) {
      Alert.alert('Validação', 'O username precisa ter pelo menos 3 caracteres.');
      return false;
    }

    if (!/^[a-z0-9_]+$/.test(un)) {
      Alert.alert('Validação', 'Username deve conter apenas: a-z, 0-9 e _.');
      return false;
    }

    return true;
  };

  const saveProfileChanges = async () => {
    if (saving) return;
    if (!validateProfile()) return;

    setSaving(true);
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        Alert.alert('Sessão expirada', 'Faça login novamente para salvar seu perfil.', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        return;
      }
      
      
      const payload = {
        id: userId,
        full_name: tempFullName.trim(),
        username: tempUsername.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      // Atualiza UI imediatamente após salvar
      setFullName(payload.full_name);
      setUsername(payload.username);

      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch (e: any) {
      console.error('Erro ao salvar perfil:', e);
      Alert.alert('Erro', e?.message || 'Falha ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja desconectar sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }
      }
    ]);
  };

  const OptionRow = ({ icon, color, label, value, onToggle, isDestructive, onPress }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!!onToggle}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <Text style={[styles.rowLabel, isDestructive && { color: '#FF3B30' }]}>{label}</Text>

      {onToggle !== undefined ? (
        <Switch value={value} onValueChange={onToggle} />
      ) : (
        !isDestructive && <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      )}
    </TouchableOpacity>
  );

  const profileSubtitle = username?.trim()
    ? `@${username.trim()}`
    : (profileLoading ? 'Carregando...' : 'Defina seu username');

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* PERFIL (EDITÁVEL) */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {profileLoading ? (
            <>
              <View style={{ height: 10 }} />
              <ActivityIndicator />
              <View style={{ height: 10 }} />
            </>
          ) : null}

          <Text style={styles.profileName}>
            {fullName?.trim() ? fullName.trim() : (profileLoading ? '' : 'Defina seu nome')}
          </Text>
          <Text style={styles.profileRole}>{profileSubtitle}</Text>

          <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal}>
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* SEÇÃO GERAL */}
        <Text style={styles.sectionTitle}>GERAL</Text>
        <View style={styles.section}>
          <OptionRow
            icon="moon" color="#5856D6" label="Modo Escuro"
            value={darkMode} onToggle={setDarkMode}
          />
          <View style={styles.divider} />
          <OptionRow
            icon="notifications" color="#FF3B30" label="Notificações"
            value={notifications} onToggle={setNotifications}
          />
        </View>

        {/* SEÇÃO CONTEÚDO */}
        <Text style={styles.sectionTitle}>CONTEÚDO</Text>
        <View style={styles.section}>
          <OptionRow icon="book" color="#007AFF" label="Versão da Bíblia (NVI)" onPress={() => Alert.alert("Em breve", "Mais versões virão!")} />
          <View style={styles.divider} />
          <OptionRow icon="text" color="#34C759" label="Tamanho da Fonte" onPress={() => Alert.alert("Ajuste", "Use os botões na tela de leitura.")} />
        </View>

        {/* SEÇÃO CONTA */}
        <Text style={styles.sectionTitle}>CONTA</Text>
        <View style={styles.section}>
          <OptionRow icon="help-circle" color="#8E8E93" label="Ajuda e Suporte" onPress={() => Alert.alert("Contato", "Suporte via WhatsApp.")} />
          <View style={styles.divider} />
          <OptionRow icon="log-out" color="#FF3B30" label="Sair da Conta" isDestructive onPress={handleLogout} />
        </View>

        <Text style={styles.version}>Versão 1.0.0 (Beta)</Text>
      </ScrollView>

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={tempFullName}
              onChangeText={setTempFullName}
              placeholder="Seu nome"
              autoCapitalize="words"
              editable={!saving}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={tempUsername}
              onChangeText={(v) => setTempUsername((v || '').toLowerCase())}
              placeholder="ex: junior_123"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
            />

            <Text style={styles.helper}>
              Regras: nome ≥ 2 caracteres; username ≥ 3; apenas a-z, 0-9 e _.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => (saving ? null : setIsEditing(false))} style={styles.cancelBtn} disabled={saving}>
                <Text style={[styles.cancelBtnText, saving && { opacity: 0.6 }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveProfileChanges} style={[styles.saveBtn, saving && { opacity: 0.8 }]} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backText: { fontSize: 17, color: '#007AFF', marginLeft: -5 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  content: { paddingBottom: 40 },

  // PERFIL
  profileSection: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { position: 'relative', marginBottom: 10 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#C7C7CC', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F2F2F7' },

  profileName: { fontSize: 24, fontWeight: '800', color: '#000' },
  profileRole: { fontSize: 15, color: '#8E8E93', marginBottom: 10 },
  editProfileBtn: { paddingHorizontal: 15, paddingVertical: 6, backgroundColor: '#E3F2FD', borderRadius: 15 },
  editProfileText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },

  // SEÇÕES
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginLeft: 20, marginBottom: 5, marginTop: 20 },
  section: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', marginHorizontal: 15 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, justifyContent: 'space-between' },
  iconBox: { width: 30, height: 30, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowLabel: { flex: 1, fontSize: 16, color: '#000' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginLeft: 57 },
  version: { textAlign: 'center', color: '#C7C7CC', marginTop: 30, fontSize: 12 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 10, fontSize: 16 },
  helper: { marginTop: 8, color: '#8E8E93', fontSize: 12, lineHeight: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: '#FF3B30', fontSize: 16 },
  saveBtn: { padding: 15, backgroundColor: '#007AFF', borderRadius: 10, flex: 1, alignItems: 'center', marginLeft: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
