// src/features/ai-coach/hooks/useTheologicalAnalysis.ts
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useRef, useState } from 'react';
import { Alert, Share } from 'react-native';

import { fetchAIAnalysis, generateSpeech } from '@/lib/openai';
import { getSupabaseOrThrow } from '@/lib/supabaseClient';

export type AnalysisData = {
  theme?: string;
  exegesis?: string;
  history?: string;
  theology?: string;
  application?: string;
};

type FetchAIResult = {
  theme?: string;
  intro?: string;
  exegesis?: string;
  original?: string;
  history?: string;
  context?: string;
  theology?: string;
  doctrine?: string;
  application?: string;
  conclusion?: string;
};

export function useTheologicalAnalysis() {
  // ✅ Crie o client dentro do hook
  const supabase = getSupabaseOrThrow();

  // --- ESTADOS ---
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [saving, setSaving] = useState(false);

  // Áudio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  // Evita setState após unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- CONFIGURAÇÃO DE ÁUDIO ---
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
        });
      } catch (err) {
        console.log('Erro de config de áudio', err);
      }
    })();
  }, []);

  // Descarrega som ao sair
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch {}
    if (mountedRef.current) {
      setSound(null);
      setIsSpeaking(false);
    }
  };

  // 1) Analisar (IA)
  const analyzeContext = async (prompt: string, contextTitle: string) => {
    await stopAudio();

    setTitle(contextTitle);
    setModalVisible(true);
    setLoading(true);
    setData(null);

    try {
      const result = (await fetchAIAnalysis(prompt, 'CHAPTER')) as FetchAIResult | null;

      if (!mountedRef.current) return;

      if (result) {
        setData({
          theme: result.theme || result.intro || 'Tema em análise...',
          exegesis: result.exegesis || result.original || 'Análise textual indisponível.',
          history: result.history || result.context || 'Dados históricos não encontrados.',
          theology: result.theology || result.doctrine || 'Conceito teológico profundo.',
          application: result.application || result.conclusion || 'Reflexão pessoal.',
        });
      } else {
        setData({ theme: 'Erro', exegesis: 'Não foi possível consultar a IA.' });
      }
    } catch (error) {
      console.error(error);
      if (mountedRef.current) {
        setData({ theme: 'Erro', exegesis: 'Falha na comunicação.' });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // 2) Falar (iOS/Android: escreve no cache e toca via arquivo local)
  const speakAnalysis = async () => {
    if (!data) return;

    // Toggle Pause/Play
    if (sound) {
      try {
        if (isSpeaking) {
          await sound.pauseAsync();
          if (mountedRef.current) setIsSpeaking(false);
        } else {
          await sound.playAsync();
          if (mountedRef.current) setIsSpeaking(true);
        }
      } catch (e) {
        console.error('Erro ao alternar play/pause:', e);
      }
      return;
    }

    try {
      setAudioLoading(true);

      const textToSpeak =
        `Estudo: ${title}. ` +
        `Tema: ${data.theme ?? ''}. ` +
        `Exegese: ${data.exegesis ?? ''}. ` +
        `Aplicação: ${data.application ?? ''}`;

      const safeText = textToSpeak.slice(0, 3800);

      // ✅ base64 (apenas o conteúdo, sem "data:audio/...")
      const base64data = await generateSpeech(safeText);
      if (!base64data) throw new Error('Áudio vazio recebido da API');

      // ✅ Diretório compatível
      const dir =
      (FileSystem as any).cacheDirectory ??
      (FileSystem as any).documentDirectory;
      if (!dir) throw new Error('Nenhum diretório disponível no FileSystem.');

      const fileUri = `${dir}theology_${Date.now()}.mp3`;

      // ✅ Sem EncodingType (evita vermelho em algumas configs de TS)
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: 'base64',
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          newSound.unloadAsync().catch(() => {});
          if (mountedRef.current) {
            setSound(null);
            setIsSpeaking(false);
          }
          FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
        }
      });

      if (!mountedRef.current) {
        await newSound.unloadAsync();
        return;
      }

      setSound(newSound);
      setIsSpeaking(true);
    } catch (e: any) {
      console.error('Erro Áudio:', e);
      Alert.alert('Erro de Áudio', 'Não foi possível reproduzir.');
    } finally {
      if (mountedRef.current) setAudioLoading(false);
    }
  };

  // 3) Compartilhar
  const handleShare = async () => {
    if (!data) return;

    const message =
      `*ESTUDO BÍBLICO: ${title}*\n\n` +
      `📖 *Tema:* ${data.theme ?? ''}\n` +
      `🔎 *Exegese:* ${data.exegesis ?? ''}\n` +
      `🏛️ *Histórico:* ${data.history ?? ''}\n` +
      `✝️ *Teologia:* ${data.theology ?? ''}\n` +
      `🌱 *Aplicação:* ${data.application ?? ''}`;

    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Erro', 'Falha ao compartilhar.');
    }
  };

  // 4) Salvar
  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('saved_notes').insert({
        title,
        reference: title,
        content: JSON.stringify(data),
      });

      if (error) throw error;

      Alert.alert('Sucesso!', 'Estudo salvo com sucesso.');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao salvar nota.');
    } finally {
      setSaving(false);
    }
  };

  return {
    modalVisible,
    setModalVisible,
    loading,
    title,
    data,

    analyzeContext,

    speakAnalysis,
    isSpeaking,
    audioLoading,

    handleShare,

    handleSave,
    saving,

    stopAudio,
  };
}
