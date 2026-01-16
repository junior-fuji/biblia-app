import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert, Image,
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
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  
  // Estados de Configuração
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Estados do Perfil
  const [name, setName] = useState('Junior');
  const [role, setRole] = useState('Pastor Auxiliar');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempRole, setTempRole] = useState('');

  // Carregar dados salvos ao abrir
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
        const savedName = await AsyncStorage.getItem('user_name');
        const savedRole = await AsyncStorage.getItem('user_role');
        const savedAvatar = await AsyncStorage.getItem('user_avatar');
        
        if (savedName) setName(savedName);
        if (savedRole) setRole(savedRole);
        if (savedAvatar) setAvatar(savedAvatar);
    } catch (e) {}
  };

  const handlePickImage = async () => {
    // Pede permissão e abre a galeria
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
      await AsyncStorage.setItem('user_avatar', result.assets[0].uri);
    }
  };

  const openEditModal = () => {
    setTempName(name);
    setTempRole(role);
    setIsEditing(true);
  };

  const saveProfileChanges = async () => {
    setName(tempName);
    setRole(tempRole);
    await AsyncStorage.setItem('user_name', tempName);
    await AsyncStorage.setItem('user_role', tempRole);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja desconectar sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/'); 
      }}
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
            <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{width: 70}} /> 
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
            
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileRole}>{role}</Text>
            
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
                    value={tempName} 
                    onChangeText={setTempName} 
                    placeholder="Seu nome"
                />

                <Text style={styles.label}>Cargo / Função</Text>
                <TextInput 
                    style={styles.input} 
                    value={tempRole} 
                    onChangeText={setTempRole} 
                    placeholder="Ex: Pastor Auxiliar"
                />

                <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveProfileChanges} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Salvar</Text>
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
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
  cancelBtnText: { color: '#FF3B30', fontSize: 16 },
  saveBtn: { padding: 15, backgroundColor: '#007AFF', borderRadius: 10, flex: 1, alignItems: 'center', marginLeft: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});