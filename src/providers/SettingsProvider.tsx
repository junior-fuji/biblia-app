import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Settings = {
  bibleVersion: string;
  fontSize: number;
  darkMode: boolean;
};

type SettingsContextType = {
  settings: Settings;
  setBibleVersion: (v: string) => void;
  setFontSize: (v: number) => void;
  setDarkMode: (v: boolean) => void;
};

const defaultSettings: Settings = {
  bibleVersion: 'NVI',
  fontSize: 16,
  darkMode: false,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  setBibleVersion: () => {},
  setFontSize: () => {},
  setDarkMode: () => {},
});

const KEYS = {
  bibleVersion: 'APP_SETTINGS_BIBLE_VERSION',
  fontSize: 'APP_SETTINGS_FONT_SIZE',
  darkMode: 'APP_SETTINGS_DARK_MODE',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [bibleVersion, fontSize, darkMode] = await Promise.all([
        AsyncStorage.getItem(KEYS.bibleVersion),
        AsyncStorage.getItem(KEYS.fontSize),
        AsyncStorage.getItem(KEYS.darkMode),
      ]);

      setSettings({
        bibleVersion: bibleVersion || 'NVI',
        fontSize: fontSize ? Number(fontSize) : 16,
        darkMode: darkMode ? JSON.parse(darkMode) : false,
      });
    } catch {}
  }

  async function update(key: keyof Settings, value: any) {
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      if (key === 'darkMode') {
        await AsyncStorage.setItem(KEYS.darkMode, JSON.stringify(value));
      } else {
        await AsyncStorage.setItem(KEYS[key], String(value));
      }
    } catch {}
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setBibleVersion: (v) => update('bibleVersion', v),
        setFontSize: (v) => update('fontSize', v),
        setDarkMode: (v) => update('darkMode', v),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}