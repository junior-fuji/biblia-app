import { getSupabaseOrNull } from '@/lib/supabaseClient';
import { useAuth } from '@/src/providers/AuthProvider';
import { ProjectorTheme, useSettings } from '@/src/providers/SettingsProvider';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type VersionRow = {
  id: string;
  code: string;
  name: string;
};

type OptionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  isDestructive?: boolean;
  onPress?: () => void;
  rightText?: string;
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
  isDestructive,
  onPress,
  rightText,
}: OptionRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>

      <Text style={[styles.rowLabel, isDestructive && { color: '#FF3B30' }]}>{label}</Text>

      {rightText ? (
        <Text style={styles.rightText}>{rightText}</Text>
      ) : !isDestructive ? (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { session, initialized } = useAuth();
  const { settings, setBibleVersion, setFontSize, setProjectorTheme } = useSettings();

  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreviewUri, setAvatarPreviewUri] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [versionModal, setVersionModal] = useState(false);
  const [fontModal, setFontModal] = useState(false);
  const [projectorThemeModal, setProjectorThemeModal] = useState(false);

  const [editNameModal, setEditNameModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const fontSizes = useMemo(
    () => [
      { label: 'Pequena', value: 14 },
      { label: 'Média', value: 16 },
      { label: 'Grande', value: 18 },
      { label: 'Extra', value: 20 },
    ],
    []
  );

  const projectorThemes = useMemo(
    () => [
      {
        label: 'Escuro',
        value: 'dark' as ProjectorTheme,
        description: 'Fundo preto com letras brancas',
      },
      {
        label: 'Claro',
        value: 'light' as ProjectorTheme,
        description: 'Fundo branco com letras pretas em negrito',
      },
    ],
    []
  );

  useEffect(() => {
    let mounted = true;

    async function loadVersions() {
      const sb = getSupabaseOrNull();
      if (!sb) return;

      try {
        setVersionsLoading(true);

        const { data, error } = await sb
          .from('bible_versions')
          .select('id, code, name')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!mounted) return;

        if (error) {
          console.log('SETTINGS_LOAD_VERSIONS_ERROR', error);
          return;
        }

        const rows = (data ?? []) as VersionRow[];
        setVersions(rows);

        if (rows.length > 0 && !rows.some((v) => v.code === settings.bibleVersion)) {
          setBibleVersion(rows[0].code);
        }
      } catch (e) {
        if (!mounted) return;
        console.log('SETTINGS_LOAD_VERSIONS_FATAL', e);
      } finally {
        if (mounted) setVersionsLoading(false);
      }
    }

    void loadVersions();

    return () => {
      mounted = false;
    };
  }, [setBibleVersion, settings.bibleVersion]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const sb = getSupabaseOrNull();
      const userId = session?.user?.id;

      if (!sb || !userId) {
        setProfileName('');
        setAvatarUrl('');
        setAvatarPreviewUri('');
        return;
      }

      try {
        const result = await Promise.race([
          sb.from('profiles').select('name, avatar_url').eq('id', userId).maybeSingle(),
          timeoutAfter(10000),
        ]);

        if (!mounted) return;

        const { data, error } = result as any;

        if (error) {
          console.log('LOAD_PROFILE_SETTINGS_ERROR', error);
          setProfileName('');
          setAvatarUrl('');
          setAvatarPreviewUri('');
          return;
        }

        setProfileName(String(data?.name ?? '').trim());
        setAvatarUrl(String(data?.avatar_url ?? '').trim());
        setAvatarPreviewUri('');
      } catch (e) {
        if (!mounted) return;
        console.log('LOAD_PROFILE_SETTINGS_FATAL', e);
        setProfileName('');
        setAvatarUrl('');
        setAvatarPreviewUri('');
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  async function handleLogout() {
    try {
      const sb = getSupabaseOrNull();

      if (!sb) {
        Alert.alert('Conta', 'Supabase indisponível neste build.');
        return;
      }

      const { error } = await sb.auth.signOut();
      if (error) throw error;

      Alert.alert('Conta', 'Você saiu da conta com sucesso.');
      router.replace('/(auth)/login' as any);
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

      const profilePayload = {
        id: session.user.id,
        name: nextName,
        avatar_url: avatarUrl || null,
      };

      const { data: savedProfile, error } = await sb
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('id, name, avatar_url')
        .single();

      if (error) throw error;

      setProfileName(String(savedProfile?.name ?? nextName));
      setAvatarUrl(String(savedProfile?.avatar_url ?? avatarUrl ?? ''));
      setAvatarPreviewUri('');
      setEditNameModal(false);

      Alert.alert('Perfil', 'Nome atualizado com sucesso.');
    } catch (e: any) {
      console.log('SAVE_PROFILE_NAME_ERROR', e);
      Alert.alert('Erro', e?.message || 'Erro ao atualizar nome.');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePickAvatar() {
    if (!session?.user) {
      router.push('/(auth)/login' as any);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita acesso à galeria para escolher uma foto de perfil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      if (asset.uri) {
        setAvatarPreviewUri(asset.uri);
      }

      if (!asset.base64) {
        Alert.alert('Avatar', 'Não foi possível processar a imagem escolhida.');
        return;
      }

      const sb = getSupabaseOrNull();
      if (!sb) {
        Alert.alert('Avatar', 'Supabase indisponível neste build.');
        return;
      }

      setUploadingAvatar(true);

      const ext =
        asset.mimeType?.includes('png')
          ? 'png'
          : asset.mimeType?.includes('webp')
          ? 'webp'
          : 'jpg';

      const filePath = `${session.user.id}/avatar.${ext}`;

      const { error: uploadError } = await sb.storage
        .from('avatars')
        .upload(filePath, decode(asset.base64), {
          contentType: asset.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.log('AVATAR_UPLOAD_ERROR', uploadError);
        Alert.alert('Avatar', uploadError.message || 'Erro ao enviar imagem.');
        return;
      }

      const { data: publicData } = sb.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl ? `${publicData.publicUrl}?t=${Date.now()}` : '';

      if (!publicUrl) {
        Alert.alert('Avatar', 'Não foi possível obter a URL da imagem.');
        return;
      }

      const profilePayload = {
        id: session.user.id,
        name: profileName || session.user.email?.split('@')[0] || 'Usuário',
        avatar_url: publicUrl,
      };

      const { data: savedProfile, error: profileError } = await sb
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select('id, name, avatar_url')
        .single();

      if (profileError) {
        console.log('AVATAR_PROFILE_UPSERT_ERROR', profileError);
        Alert.alert('Avatar', profileError.message || 'Erro ao salvar perfil.');
        return;
      }

      setProfileName(String(savedProfile?.name ?? profilePayload.name));
      setAvatarUrl(String(savedProfile?.avatar_url ?? publicUrl));
      setAvatarPreviewUri('');

      Alert.alert('Avatar', 'Foto de perfil atualizada com sucesso.');
    } catch (e: any) {
      console.log('HANDLE_PICK_AVATAR_ERROR', e);
      Alert.alert('Avatar', e?.message || 'Não foi possível atualizar a foto.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const userEmail = session?.user?.email || 'Não autenticado';
  const displayName = profileName || session?.user?.email?.split('@')[0] || 'Usuário';
  const projectorThemeLabel = settings.projectorTheme === 'light' ? 'Claro' : 'Escuro';
  const avatarSource = avatarPreviewUri || avatarUrl;

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
          <View style={styles.avatarWrap}>
            <View style={styles.avatarPlaceholder}>
              {avatarSource ? (
                <Image source={{ uri: avatarSource }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#fff" />
              )}

              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.editAvatarLink} onPress={handlePickAvatar} disabled={uploadingAvatar}>
              <Text style={styles.editAvatarLinkText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>{!initialized ? 'Verificando sessão...' : userEmail}</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => {
              if (!session?.user) {
                router.push('/(auth)/login' as any);
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
            rightText="Em breve"
            onPress={() =>
              Alert.alert(
                'Em breve',
                'O tema do app inteiro ainda não foi implementado. Por enquanto, a configuração real disponível é o Tema da Projeção.'
              )
            }
          />
          <View style={styles.divider} />
          <OptionRow
            icon="notifications"
            color="#FF3B30"
            label="Notificações"
            rightText="Em breve"
            onPress={() =>
              Alert.alert(
                'Em breve',
                'As notificações ainda não estão integradas. Vamos deixar esse item apenas informativo por enquanto.'
              )
            }
          />
        </View>

        <Text style={styles.sectionTitle}>CONTEÚDO</Text>
        <View style={styles.section}>
          <OptionRow
            icon="book"
            color="#007AFF"
            label="Versão da Bíblia"
            rightText={settings.bibleVersion}
            onPress={() => setVersionModal(true)}
          />
          <View style={styles.divider} />
          <OptionRow
            icon="text"
            color="#34C759"
            label="Tamanho da Fonte"
            rightText={`${settings.fontSize}`}
            onPress={() => setFontModal(true)}
          />
        </View>

        <Text style={styles.sectionTitle}>PROJEÇÃO</Text>
        <View style={styles.section}>
          <OptionRow
            icon="tv"
            color="#111827"
            label="Tema da Projeção"
            rightText={projectorThemeLabel}
            onPress={() => setProjectorThemeModal(true)}
          />
        </View>

        <Text style={styles.projectorHint}>
          Use “Claro” para igrejas com ambiente iluminado: fundo branco e letras pretas em negrito.
        </Text>

        <Text style={styles.sectionTitle}>CONTA</Text>
        <View style={styles.section}>
          {!session?.user ? (
            <>
              <OptionRow
                icon="log-in"
                color="#007AFF"
                label="Entrar / Criar conta"
                onPress={() => router.push('/(auth)/login' as any)}
              />
              <View style={styles.divider} />
            </>
          ) : null}

          <OptionRow
            icon="help-circle"
            color="#8E8E93"
            label="Ajuda e Suporte"
            onPress={() => Alert.alert('Contato', 'Defina aqui seu canal de suporte da igreja ou WhatsApp.')}
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

      <Modal visible={versionModal} transparent animationType="fade" onRequestClose={() => setVersionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Versão da Bíblia</Text>

            {versionsLoading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              versions.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setBibleVersion(v.code);
                    setVersionModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, v.code === settings.bibleVersion && { color: '#007AFF' }]}>
                    {v.code} — {v.name}
                  </Text>
                  {v.code === settings.bibleVersion ? (
                    <Ionicons name="checkmark" size={18} color="#007AFF" />
                  ) : null}
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity style={styles.modalClose} onPress={() => setVersionModal(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={fontModal} transparent animationType="fade" onRequestClose={() => setFontModal(false)}>
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
                <Text style={[styles.modalItemText, f.value === settings.fontSize && { color: '#007AFF' }]}>
                  {f.label} ({f.value})
                </Text>
                {f.value === settings.fontSize ? (
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

      <Modal
        visible={projectorThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setProjectorThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tema da Projeção</Text>

            {projectorThemes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalItem}
                onPress={() => {
                  setProjectorTheme(item.value);
                  setProjectorThemeModal(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.modalItemText,
                      item.value === settings.projectorTheme && { color: '#007AFF' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.modalItemDescription}>{item.description}</Text>
                </View>

                {item.value === settings.projectorTheme ? (
                  <Ionicons name="checkmark" size={18} color="#007AFF" />
                ) : null}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalClose} onPress={() => setProjectorThemeModal(false)}>
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

            <TouchableOpacity onPress={handleSaveName} disabled={savingName} style={styles.primaryActionBtn}>
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

  avatarWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },

  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editAvatarLink: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  editAvatarLinkText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 13,
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
  projectorHint: {
    marginTop: 10,
    marginHorizontal: 20,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 19,
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
  modalItemDescription: { marginTop: 4, fontSize: 13, color: '#6B7280' },
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