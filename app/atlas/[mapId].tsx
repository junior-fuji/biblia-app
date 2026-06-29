import {
    AtlasMarker,
    getAtlasMapById,
} from '@/src/data/atlas/atlasMaps';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
  
  export default function AtlasMapScreen() {
    const router = useRouter();
    const { colors, isDark } = useAppTheme();
    const { mapId } = useLocalSearchParams<{ mapId?: string }>();
  
    const map = useMemo(() => {
      return getAtlasMapById(String(mapId ?? ''));
    }, [mapId]);
  
    const [selectedMarker, setSelectedMarker] = useState<AtlasMarker | null>(
      map?.markers[0] ?? null,
    );
  
    if (!map) {
      return (
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.notFound}>
            <Text style={[styles.notFoundTitle, { color: colors.text }]}>
              Mapa não encontrado
            </Text>
  
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backHomeButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.backHomeText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
  
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
  
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                {map.title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                {map.subtitle}
              </Text>
            </View>
          </View>
  
          <View
            style={[
              styles.mapCard,
              {
                backgroundColor: isDark ? '#111827' : '#F8F2E7',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderTitle}>
                {map.title}
              </Text>
  
              <Text style={styles.mapPlaceholderSubtitle}>
                Mapa visual será inserido aqui
              </Text>
  
              <Text style={styles.mapPlaceholderNote}>
                Base: atlas moderno histórico com relevo, montes, vales, desertos e rotas.
              </Text>
  
              {map.markers.map((marker) => (
                <TouchableOpacity
                  key={marker.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedMarker(marker)}
                  style={[
                    styles.marker,
                    {
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      backgroundColor:
                        selectedMarker?.id === marker.id ? '#D97706' : '#1F2937',
                    },
                  ]}
                >
                  <Text style={styles.markerText}>•</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
  
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.infoLabel, { color: colors.muted }]}>
              {map.period}
            </Text>
  
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Resumo histórico-teológico
            </Text>
  
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {map.summary}
            </Text>
          </View>
  
          {selectedMarker ? (
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.infoLabel, { color: '#B7791F' }]}>
                Local selecionado
              </Text>
  
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {selectedMarker.title}
              </Text>
  
              {selectedMarker.subtitle ? (
                <Text style={[styles.markerSubtitle, { color: colors.muted }]}>
                  {selectedMarker.subtitle}
                </Text>
              ) : null}
  
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {selectedMarker.description}
              </Text>
  
              <View style={styles.referenceList}>
                {selectedMarker.references.map((reference) => (
                  <View key={reference} style={styles.referencePill}>
                    <Ionicons name="book-outline" size={14} color="#B7791F" />
                    <Text style={styles.referenceText}>{reference}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
  
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Referências bíblicas principais
            </Text>
  
            <View style={styles.referenceList}>
              {map.references.map((reference) => (
                <View key={reference} style={styles.referencePill}>
                  <Ionicons name="book-outline" size={14} color="#B7791F" />
                  <Text style={styles.referenceText}>{reference}</Text>
                </View>
              ))}
            </View>
          </View>
  
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  
    content: {
      padding: 20,
      paddingBottom: 40,
    },
  
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
  
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
  
    headerText: {
      flex: 1,
    },
  
    title: {
      fontSize: 26,
      fontWeight: '900',
    },
  
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 20,
    },
  
    mapCard: {
      borderWidth: 1,
      borderRadius: 22,
      padding: 12,
      marginBottom: 16,
    },
  
    mapPlaceholder: {
      position: 'relative',
      height: 360,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: '#E8D7B7',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
  
    mapPlaceholderTitle: {
      color: '#1F2937',
      fontSize: 26,
      fontWeight: '900',
      textAlign: 'center',
    },
  
    mapPlaceholderSubtitle: {
      color: '#6B4E2E',
      fontSize: 15,
      fontWeight: '800',
      marginTop: 8,
      textAlign: 'center',
    },
  
    mapPlaceholderNote: {
      color: '#6B4E2E',
      fontSize: 13,
      lineHeight: 19,
      marginTop: 10,
      textAlign: 'center',
      maxWidth: 360,
    },
  
    marker: {
      position: 'absolute',
      width: 22,
      height: 22,
      marginLeft: -11,
      marginTop: -11,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    markerText: {
      color: '#FFFFFF',
      fontSize: 20,
      lineHeight: 20,
      fontWeight: '900',
    },
  
    infoCard: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
    },
  
    infoLabel: {
      fontSize: 12,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginBottom: 6,
    },
  
    infoTitle: {
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 8,
    },
  
    markerSubtitle: {
      fontSize: 14,
      fontWeight: '700',
      marginTop: -3,
      marginBottom: 10,
    },
  
    infoText: {
      fontSize: 15,
      lineHeight: 23,
    },
  
    referenceList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
  
    referencePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#B7791F18',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
  
    referenceText: {
      color: '#B7791F',
      fontSize: 12,
      fontWeight: '800',
    },
  
    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
  
    notFoundTitle: {
      fontSize: 22,
      fontWeight: '900',
      marginBottom: 16,
    },
  
    backHomeButton: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
    },
  
    backHomeText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },
  
    bottomSpacer: {
      height: 24,
    },
  });