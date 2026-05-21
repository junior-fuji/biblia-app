import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ProjectorTheme = 'dark' | 'light';

export type AppTheme = 'system' | 'light' | 'dark';

export type Settings = {
  bibleVersion: string;
  fontSize: number;
  darkMode: boolean;
  appTheme: AppTheme;
  projectorTheme: ProjectorTheme;
};

type SettingsContextType = {
  settings: Settings;
  initialized: boolean;

  setBibleVersion: (v: string) => void;
  setFontSize: (v: number) => void;
  setDarkMode: (v: boolean) => void;
  setAppTheme: (v: AppTheme) => void;
  setProjectorTheme: (v: ProjectorTheme) => void;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
};

const MIN_READER_FONT_SIZE = 12;
const MAX_READER_FONT_SIZE = 40;

export const defaultSettings: Settings = {
  bibleVersion: 'NVI',
  fontSize: 20,
  darkMode: false,
  appTheme: 'system',
  projectorTheme: 'dark',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  initialized: false,

  setBibleVersion: () => {},
  setFontSize: () => {},
  setDarkMode: () => {},
  setAppTheme: () => {},
  setProjectorTheme: () => {},

  updateSettings: async () => {},
  reloadSettings: async () => {},
  resetSettings: async () => {},
});

const KEYS = {
  bibleVersion: 'APP_SETTINGS_BIBLE_VERSION',
  fontSize: 'APP_SETTINGS_FONT_SIZE',
  darkMode: 'APP_SETTINGS_DARK_MODE',
  appTheme: 'APP_SETTINGS_APP_THEME',
  projectorTheme: 'APP_SETTINGS_PROJECTOR_THEME',
} satisfies Record<keyof Settings, string>;

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeBibleVersion(value: string | null): string {
  const clean = String(value ?? '').trim();

  if (!clean) {
    return defaultSettings.bibleVersion;
  }

  return clean;
}

function normalizeFontSize(value: string | number | null): number {
  const parsed =
    typeof value === 'number'
      ? value
      : value
        ? Number(value)
        : defaultSettings.fontSize;

  return clampNumber(
    parsed,
    MIN_READER_FONT_SIZE,
    MAX_READER_FONT_SIZE,
  );
}

function normalizeBoolean(value: string | boolean | null): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  try {
    return value ? Boolean(JSON.parse(value)) : defaultSettings.darkMode;
  } catch {
    return defaultSettings.darkMode;
  }
}

function normalizeAppTheme(value: string | null): AppTheme {
  if (value === 'system' || value === 'light' || value === 'dark') {
    return value;
  }

  return defaultSettings.appTheme;
}

function normalizeProjectorTheme(value: string | null): ProjectorTheme {
  if (value === 'light' || value === 'dark') {
    return value;
  }

  return defaultSettings.projectorTheme;
}

function normalizeSettings(input: Partial<Settings>): Settings {
  return {
    bibleVersion: normalizeBibleVersion(
      input.bibleVersion ?? defaultSettings.bibleVersion,
    ),
    fontSize: normalizeFontSize(input.fontSize ?? defaultSettings.fontSize),
    darkMode:
      typeof input.darkMode === 'boolean'
        ? input.darkMode
        : defaultSettings.darkMode,
    appTheme: normalizeAppTheme(input.appTheme ?? defaultSettings.appTheme),
    projectorTheme: normalizeProjectorTheme(
      input.projectorTheme ?? defaultSettings.projectorTheme,
    ),
  };
}

async function persistSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
) {
  if (key === 'darkMode') {
    await AsyncStorage.setItem(KEYS.darkMode, JSON.stringify(value));
    return;
  }

  await AsyncStorage.setItem(KEYS[key], String(value));
}

async function readSettingsFromStorage(): Promise<Settings> {
  const [bibleVersion, fontSize, darkMode, appTheme, projectorTheme] =
    await Promise.all([
      AsyncStorage.getItem(KEYS.bibleVersion),
      AsyncStorage.getItem(KEYS.fontSize),
      AsyncStorage.getItem(KEYS.darkMode),
      AsyncStorage.getItem(KEYS.appTheme),
      AsyncStorage.getItem(KEYS.projectorTheme),
    ]);

  return {
    bibleVersion: normalizeBibleVersion(bibleVersion),
    fontSize: normalizeFontSize(fontSize),
    darkMode: normalizeBoolean(darkMode),
    appTheme: normalizeAppTheme(appTheme),
    projectorTheme: normalizeProjectorTheme(projectorTheme),
  };
}

async function persistAllSettings(settings: Settings) {
  await Promise.all([
    AsyncStorage.setItem(KEYS.bibleVersion, settings.bibleVersion),
    AsyncStorage.setItem(KEYS.fontSize, String(settings.fontSize)),
    AsyncStorage.setItem(KEYS.darkMode, JSON.stringify(settings.darkMode)),
    AsyncStorage.setItem(KEYS.appTheme, settings.appTheme),
    AsyncStorage.setItem(KEYS.projectorTheme, settings.projectorTheme),
  ]);
}

async function clearStoredSettings() {
  await Promise.all(Object.values(KEYS).map((key) => AsyncStorage.removeItem(key)));
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [initialized, setInitialized] = useState(false);

  const reloadSettings = useCallback(async () => {
    try {
      const loadedSettings = await readSettingsFromStorage();
      setSettings(loadedSettings);
    } catch (error) {
      console.log('SETTINGS_LOAD_ERROR', error);
      setSettings(defaultSettings);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    void reloadSettings();
  }, [reloadSettings]);

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      const normalizedNext = normalizeSettings({
        ...settings,
        [key]: value,
      });

      const nextValue = normalizedNext[key];

      setSettings(normalizedNext);

      try {
        await persistSetting(key, nextValue);
      } catch (error) {
        console.log('SETTINGS_UPDATE_ERROR', key, error);
      }
    },
    [settings],
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const normalizedNext = normalizeSettings({
        ...settings,
        ...patch,
      });

      setSettings(normalizedNext);

      try {
        await persistAllSettings(normalizedNext);
      } catch (error) {
        console.log('SETTINGS_UPDATE_PATCH_ERROR', error);
      }
    },
    [settings],
  );

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);

    try {
      await clearStoredSettings();
      await persistAllSettings(defaultSettings);
    } catch (error) {
      console.log('SETTINGS_RESET_ERROR', error);
    }
  }, []);

  const setBibleVersion = useCallback(
    (value: string) => {
      void updateSetting('bibleVersion', value);
    },
    [updateSetting],
  );

  const setFontSize = useCallback(
    (value: number) => {
      void updateSetting('fontSize', value);
    },
    [updateSetting],
  );

  const setDarkMode = useCallback(
    (value: boolean) => {
      void updateSetting('darkMode', value);
    },
    [updateSetting],
  );

  const setAppTheme = useCallback(
    (value: AppTheme) => {
      void updateSetting('appTheme', value);
    },
    [updateSetting],
  );

  const setProjectorTheme = useCallback(
    (value: ProjectorTheme) => {
      void updateSetting('projectorTheme', value);
    },
    [updateSetting],
  );

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      initialized,
      setBibleVersion,
      setFontSize,
      setDarkMode,
      setAppTheme,
      setProjectorTheme,
      updateSettings,
      reloadSettings,
      resetSettings,
    }),
    [
      initialized,
      reloadSettings,
      resetSettings,
      setAppTheme,
      setBibleVersion,
      setDarkMode,
      setFontSize,
      setProjectorTheme,
      settings,
      updateSettings,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}