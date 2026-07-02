import AbrahamJourneyMap from '@/src/components/atlas/AbrahamJourneyMap';
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

  function handleSelectMarker(markerId: string) {
    if (!map) return;

    const nextMarker = map.markers.find((marker) => marker.id === markerId);

    if (nextMarker) {
      setSelectedMarker(nextMarker);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
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
          <View style={styles.mapContainer}>
            {map.id === 'abraham-journey' ? (
             <AbrahamJourneyMap
             markers={map.markers}
             routes={map.routes}
             selectedMarkerId={selectedMarker?.id}
             onSelectMarker={handleSelectMarker}
           />
            ) : (
              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackTitle}>{map.title}</Text>
                <Text style={styles.mapFallbackSubtitle}>
                  Mapa visual será inserido aqui
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.locationsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.locationsHeader}>
            <View style={styles.locationsTitleRow}>
              <Ionicons name="location-outline" size={18} color="#C6922E" />
              <Text style={[styles.locationsTitle, { color: colors.text }]}>
                Locais da jornada
              </Text>
            </View>

            <Text style={[styles.locationsSubtitle, { color: colors.muted }]}>
              Toque em um local para ver detalhes abaixo
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationList}
          >
            {map.markers.map((marker, index) => {
              const active = selectedMarker?.id === marker.id;

              return (
                <TouchableOpacity
                  key={marker.id}
                  activeOpacity={0.86}
                  onPress={() => setSelectedMarker(marker)}
                  style={[
                    styles.locationCard,
                    {
                      backgroundColor: active
                        ? '#C6922E18'
                        : isDark
                          ? '#18202B'
                          : '#FFF8EA',
                      borderColor: active ? '#C6922E' : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.locationNumber,
                      {
                        backgroundColor: active ? '#C6922E' : '#1F7EAF',
                      },
                    ]}
                  >
                    <Text style={styles.locationNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.locationTextBlock}>
                    <Text
                      style={[styles.locationName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {marker.title.replace('Ur dos Caldeus', 'Ur')}
                    </Text>

                    <Text
                      style={[styles.locationSub, { color: colors.muted }]}
                      numberOfLines={2}
                    >
                      {marker.subtitle ?? marker.references[0] ?? ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
            <Text style={[styles.infoLabel, { color: '#C6922E' }]}>
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
                  <Ionicons name="book-outline" size={14} color="#C6922E" />
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
                <Ionicons name="book-outline" size={14} color="#C6922E" />
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
    borderWidth: 1,
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

  mapContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.62,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F1DFC0',
  },

  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  mapFallbackTitle: {
    color: '#1F2937',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },

  mapFallbackSubtitle: {
    color: '#8A6A3A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },

  locationsCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  locationsHeader: {
    marginBottom: 12,
  },

  locationsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  locationsTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  locationsSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },

  locationList: {
    gap: 10,
    paddingRight: 2,
  },

  locationCard: {
    width: 150,
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 16,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  locationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  locationNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  locationTextBlock: {
    flex: 1,
  },

  locationName: {
    fontSize: 14,
    fontWeight: '900',
  },

  locationSub: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
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
    backgroundColor: '#C6922E18',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  referenceText: {
    color: '#C6922E',
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