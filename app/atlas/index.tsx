import { atlasMaps } from '@/src/data/atlas/atlasMaps';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AtlasIndexScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

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
              Atlas Bíblico
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Mapas históricos com relevo, rotas e referências bíblicas
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Mapas disponíveis
        </Text>

        <View style={styles.list}>
          {atlasMaps.map((map) => (
            <TouchableOpacity
              key={map.id}
              activeOpacity={0.86}
              onPress={() => router.push(`/atlas/${map.id}` as never)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <Ionicons name="map-outline" size={24} color="#B7791F" />
                </View>

                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {map.title}
                  </Text>

                  <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                    {map.period}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </View>

              <Text
                style={[styles.cardSummary, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {map.summary}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="location-outline" size={14} color="#B7791F" />
                  <Text style={styles.metaText}>
                    {map.markers.length} locais
                  </Text>
                </View>

                <View style={styles.metaPill}>
                  <Ionicons name="git-branch-outline" size={14} color="#B7791F" />
                  <Text style={styles.metaText}>
                    {map.routes.length} rota
                  </Text>
                </View>

                <View style={styles.metaPill}>
                  <Ionicons name="book-outline" size={14} color="#B7791F" />
                  <Text style={styles.metaText}>
                    {map.references.length} refs.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    marginBottom: 28,
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
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  list: {
    gap: 14,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#B7791F22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
  },

  cardSummary: {
    fontSize: 14,
    lineHeight: 21,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#B7791F18',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  metaText: {
    color: '#B7791F',
    fontSize: 12,
    fontWeight: '800',
  },
});