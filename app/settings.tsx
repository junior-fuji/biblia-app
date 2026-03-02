import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
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
      ) : (
        !isDestructive && (
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        )
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  // Estados locais (mock / UI)
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Modais simples
  const [versionModal, setVersionModal] = useState(false);
  const [fontModal, setFontModal] = useState(false);

  // Mock de versão e fonte (você vai ligar no global store depois)
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

  const handleLogoutMock = () => {
    Alert.alert(
      'Conta (desativada)',
      'Login/conta está desativado por enquanto. Você vai ativar isso depois.',
      [{ text: 'OK' }]
    );
  };

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
        {/* PERFIL (mock) */}
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>

          <Text style={styles.profileName}>Usuário</Text>
          <Text style={styles.profileRole}>Conta desativada (modo desenvolvimento)</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() =>
              Alert.alert('Em breve', 'Quando o login voltar, você edita seu perfil aqui.')
            }
          >
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* GERAL */}
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

        {/* CONTEÚDO */}
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
            onPress={() => Alert.alert('Em breve', 'Vamos implementar o modo projetor.')}
          />
        </View>

        {/* CONTA */}
        <Text style={styles.sectionTitle}>CONTA</Text>
        <View style={styles.section}>
          <OptionRow
            icon="help-circle"
            color="#8E8E93"
            label="Ajuda e Suporte"
            onPress={() => Alert.alert('Contato', 'Suporte via WhatsApp (definir).')}
          />
          <View style={styles.divider} />
          <OptionRow
            icon="log-out"
            color="#FF3B30"
            label="Sair da Conta"
            isDestructive
            onPress={handleLogoutMock}
          />
        </View>

        <Text style={styles.version}>Versão 1.0.0 (Beta)</Text>
      </ScrollView>

      {/* MODAL: Versão */}
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

      {/* MODAL: Fonte */}
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
  section: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', marginHorizontal: 15 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, justifyContent: 'space-between' },
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
});