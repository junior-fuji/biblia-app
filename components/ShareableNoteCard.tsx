import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// Tipagem dos dados
interface NoteData {
  book: string;
  chapter: string;
  era: string;       
  application: string; 
  verseHighlight?: string; 
}

interface Props {
  data: NoteData | null; // Aceita null para evitar erro de init
  onClose?: () => void; 
}

export default function ShareableNoteCard({ data, onClose }: Props) {
  const viewRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  // Proteção contra dados vazios
  if (!data) return null;

  const shareImage = async () => {
    try {
      setSharing(true);

      // 1. Captura a View como imagem
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1, 
        result: 'tmpfile', 
      });

      // 2. Verifica disponibilidade
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
        setSharing(false);
        return;
      }

      // 3. Abre compartilhamento
      await Sharing.shareAsync(uri, {
        dialogTitle: `Anotação de ${data.book}`,
        mimeType: 'image/png',
        UTI: 'public.png',
      });

    } catch (error) {
      console.error(error);
      Alert.alert("Ops!", "Não foi possível gerar a imagem.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* --- ÁREA DO CARD (O que vira imagem) --- */}
      <View ref={viewRef} style={styles.cardParams} collapsable={false}>
        
        {/* Cabeçalho Decorativo */}
        <View style={styles.headerDecoration}>
          <Ionicons name="book" size={20} color="#8E5536" />
          <Text style={styles.eraText}>{data.era ? data.era.toUpperCase() : 'DIÁRIO BÍBLICO'}</Text>
          <Ionicons name="time" size={20} color="#8E5536" />
        </View>

        {/* Título */}
        <Text style={styles.titleText}>
          {data.book} <Text style={styles.chapterText}>{data.chapter}</Text>
        </Text>

        <View style={styles.divider} />

        {/* Conteúdo */}
        <View style={styles.contentBody}>
          <Text style={styles.label}>MINHA REFLEXÃO:</Text>
          <Text style={styles.userNote}>“{data.application}”</Text>
        </View>

        {/* Rodapé Branding */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Gerado pelo App Bíblia Cronológica</Text>
        </View>
        
        {/* Borda Decorativa */}
        <View style={styles.innerBorder} />
      </View>

      {/* Botão de Ação */}
      <TouchableOpacity 
        style={styles.shareButton} 
        onPress={shareImage}
        disabled={sharing}
      >
        {sharing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="logo-whatsapp" size={20} color="#FFF" style={{marginRight: 8}} />
            <Text style={styles.shareText}>ENVIAR PARA O GRUPO</Text>
          </>
        )}
      </TouchableOpacity>
      
      {onClose && (
        <TouchableOpacity onPress={onClose} style={{marginTop: 15}}>
           <Text style={{color: '#666'}}>Cancelar</Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  cardParams: {
    width: 300,
    backgroundColor: '#FDFBF7', // Papel Antigo
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E6DCC3',
    position: 'relative',
  },
  innerBorder: {
    position: 'absolute',
    top: 10, left: 10, right: 10, bottom: 10,
    borderWidth: 1,
    borderColor: '#D4C5A3',
    borderRadius: 8,
    pointerEvents: 'none',
  },
  headerDecoration: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  eraText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E5536',
    letterSpacing: 1.5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2C3E50',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  chapterText: {
    color: '#E67E22',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6DCC3',
    marginVertical: 15,
    width: '60%',
    alignSelf: 'center',
  },
  contentBody: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 5,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  userNote: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495E',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
  },
  footer: {
    marginTop: 5,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#AAB7B8',
    fontWeight: '600',
  },
  shareButton: {
    marginTop: 25,
    backgroundColor: '#25D366', // Cor do WhatsApp
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
  },
  shareText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  }
});