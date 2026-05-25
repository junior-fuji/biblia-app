import { invalidateBibleVersionsCache } from '@/src/features/bible/api/bibleVersions.cache';
import { useSettings } from '@/src/providers/SettingsProvider';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();

  useEffect(() => {
    invalidateBibleVersionsCache().catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (settings.appTheme === 'dark') return true;
    if (settings.appTheme === 'light') return false;
    if (settings.appTheme === 'system') return systemScheme === 'dark';

    return settings.darkMode;
  }, [settings.appTheme, settings.darkMode, systemScheme]);

  const colors = useMemo(
    () => ({
      active: isDark ? '#0A84FF' : '#007AFF',
      inactive: '#8E8E93',
      background: isDark ? '#111111' : '#FFFFFF',
      border: isDark ? '#2C2C2E' : '#E5E5EA',
      scene: isDark ? '#000000' : '#F2F2F7',
    }),
    [isDark],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
        },
        sceneStyle: {
          backgroundColor: colors.scene,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diário',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="journal-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="studies"
        options={{
          title: 'Estudos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="read"
        options={{
          title: 'Bíblia',
          tabBarLabel: 'Bíblia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="dictionary"
        options={{
          title: 'Dicionário',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plano',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />

    </Tabs>
  );
}