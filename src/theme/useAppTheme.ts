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
  
        // Fundo geral do app
        background: '#0B0F14',
  
        // Barras, headers e áreas principais
        surface: '#111827',
  
        // Cards/boxes
        card: '#18202B',
  
        // Botões secundários, chips, inputs elevados
        cardSoft: '#202A36',
  
        // Textos
        text: '#F8FAFC',
        textSecondary: '#CBD5E1',
        muted: '#94A3B8',
  
        // Linhas e bordas
        border: '#2A3441',
        divider: '#2A3441',
  
        // Cores de ação
        primary: '#60A5FA',
        danger: '#F87171',
        success: '#34D399',
        warning: '#FBBF24',
  
        // Inputs/chips
        input: '#18202B',
        chip: '#1E293B',
        chipText: '#F8FAFC',
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
