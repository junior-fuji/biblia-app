import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ProjectorTheme = 'dark' | 'light';

type Settings = {
  bibleVersion: string;
  fontSize: number;
  darkMode: boolean;
  projectorTheme: ProjectorTheme;
};

type SettingsContextType = {
  settings: Settings;
  initialized: boolean;
  setBibleVersion: (v: string) => void;
  setFontSize: (v: number) => void;
  setDarkMode: (v: boolean) => void;
  setProjectorTheme: (v: ProjectorTheme) => void;
};

const defaultSettings: Settings = {
  bibleVersion: 'NVI',
  fontSize: 16,
  darkMode: false,
  projectorTheme: 'dark',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  initialized: false,
  setBibleVersion: () => {},
  setFontSize: () => {},
  setDarkMode: () => {},
  setProjectorTheme: () => {},
});

const KEYS = {
  bibleVersion: 'APP_SETTINGS_BIBLE_VERSION',
  fontSize: 'APP_SETTINGS_FONT_SIZE',
  darkMode: 'APP_SETTINGS_DARK_MODE',
  projectorTheme: 'APP_SETTINGS_PROJECTOR_THEME',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const [bibleVersion, fontSize, darkMode, projectorTheme] = await Promise.all([
        AsyncStorage.getItem(KEYS.bibleVersion),
        AsyncStorage.getItem(KEYS.fontSize),
        AsyncStorage.getItem(KEYS.darkMode),
        AsyncStorage.getItem(KEYS.projectorTheme),
      ]);

      setSettings({
        bibleVersion: bibleVersion || defaultSettings.bibleVersion,
        fontSize: fontSize ? Number(fontSize) : defaultSettings.fontSize,
        darkMode: darkMode ? JSON.parse(darkMode) : defaultSettings.darkMode,
        projectorTheme:
          projectorTheme === 'light' || projectorTheme === 'dark'
            ? projectorTheme
            : defaultSettings.projectorTheme,
      });
    } catch (error) {
      console.log('SETTINGS_LOAD_ERROR', error);
      setSettings(defaultSettings);
    } finally {
      setInitialized(true);
    }
  }

  async function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      if (key === 'darkMode') {
        await AsyncStorage.setItem(KEYS.darkMode, JSON.stringify(value));
        return;
      }

      if (key === 'projectorTheme') {
        await AsyncStorage.setItem(KEYS.projectorTheme, String(value));
        return;
      }

      await AsyncStorage.setItem(KEYS[key], String(value));
    } catch (error) {
      console.log('SETTINGS_UPDATE_ERROR', key, error);
    }
  }

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      initialized,
      setBibleVersion: (v) => void update('bibleVersion', v),
      setFontSize: (v) => void update('fontSize', v),
      setDarkMode: (v) => void update('darkMode', v),
      setProjectorTheme: (v) => void update('projectorTheme', v),
    }),
    [initialized, settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}