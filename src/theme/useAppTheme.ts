import { useSettings } from '@/src/providers/SettingsProvider';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();

  const isDark = useMemo(() => {
    if (settings.appTheme === 'dark') return true;
    if (settings.appTheme === 'light') return false;
    if (settings.appTheme === 'system') return systemScheme === 'dark';

    return settings.darkMode;
  }, [settings.appTheme, settings.darkMode, systemScheme]);

  const colors = useMemo(
    () =>
      isDark
        ? {
            isDark: true,
            background: '#000000',
            surface: '#111111',
            card: '#1C1C1E',
            cardSoft: '#2C2C2E',
            text: '#FFFFFF',
            textSecondary: '#D1D5DB',
            muted: '#A1A1AA',
            border: '#2C2C2E',
            divider: '#2C2C2E',
            primary: '#0A84FF',
            danger: '#FF453A',
            success: '#30D158',
            warning: '#FF9F0A',
            input: '#111111',
            chip: '#1C1C1E',
            chipText: '#FFFFFF',
          }
        : {
            isDark: false,
            background: '#FFFFFF',
            surface: '#FFFFFF',
            card: '#FFFFFF',
            cardSoft: '#F3F4F6',
            text: '#111827',
            textSecondary: '#374151',
            muted: '#8E8E93',
            border: '#E5E5EA',
            divider: '#E5E5EA',
            primary: '#007AFF',
            danger: '#D70015',
            success: '#34C759',
            warning: '#FF9500',
            input: '#F2F2F7',
            chip: '#F3F4F6',
            chipText: '#111827',
          },
    [isDark],
  );

  return { isDark, colors };
}
