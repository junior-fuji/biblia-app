import { useAppTheme } from '@/src/theme/useAppTheme';
import { useResponsiveMetrics } from '@/src/theme/useResponsiveMetrics';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  color,
  size,
}: {
  name: TabIconName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();
  const metrics = useResponsiveMetrics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: metrics.tabBarHeight,
          paddingTop: metrics.isLargeDesktop ? 8 : 6,
          paddingBottom:
            Platform.OS === 'ios'
              ? metrics.isLargeDesktop
                ? 12
                : 8
              : metrics.isLargeDesktop
                ? 10
                : 6,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingVertical: metrics.isLargeDesktop ? 4 : 2,
        },
        tabBarLabelStyle: {
          fontSize: metrics.tabLabelFontSize,
          fontWeight: '700',
          marginTop: metrics.isLargeDesktop ? 2 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={isDark ? 'home' : 'home-outline'}
              color={color}
              size={metrics.tabIconSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="read"
        options={{
          title: 'Bíblia',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={isDark ? 'book' : 'book-outline'}
              color={color}
              size={metrics.tabIconSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diário',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={isDark ? 'journal' : 'journal-outline'}
              color={color}
              size={metrics.tabIconSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="studies"
        options={{
          title: 'Estudos',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={isDark ? 'create' : 'create-outline'}
              color={color}
              size={metrics.tabIconSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="dictionary"
        options={{
          title: 'Dicionário',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={isDark ? 'library' : 'library-outline'}
              color={color}
              size={metrics.tabIconSize}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plano',
          tabBarIcon: ({ color }) => (
            <TabIcon
              name={isDark ? 'calendar' : 'calendar-outline'}
              color={color}
              size={metrics.tabIconSize}
            />
          ),
        }}
      />
    </Tabs>
  );
}