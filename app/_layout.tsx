import { AuthProvider } from '@/src/providers/AuthProvider';
import { SettingsProvider, useSettings } from '@/src/providers/SettingsProvider';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { useColorScheme } from 'react-native';

function AppThemeBridge() {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();

  const isDark = useMemo(() => {
    if (settings.appTheme === 'dark') return true;
    if (settings.appTheme === 'light') return false;
    if (settings.appTheme === 'system') return systemScheme === 'dark';

    return settings.darkMode;
  }, [settings.appTheme, settings.darkMode, systemScheme]);

  const navigationTheme = useMemo(() => {
    if (isDark) {
      return {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#0A84FF',
          background: '#000000',
          card: '#111111',
          text: '#FFFFFF',
          border: '#2C2C2E',
          notification: '#FF453A',
        },
      };
    }

    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: '#007AFF',
        background: '#F2F2F7',
        card: '#FFFFFF',
        text: '#000000',
        border: '#E5E5EA',
        notification: '#FF3B30',
      },
    };
  }, [isDark]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? '#000000' : '#F2F2F7',
          },
        }}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppThemeBridge />
      </SettingsProvider>
    </AuthProvider>
  );
}