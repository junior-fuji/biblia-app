import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

// Tipos explícitos (evita vermelho no TS)
export type BibleVersionCode = "ARA" | "ARC" | "NVI";

export type LastRead = {
  versionCode: BibleVersionCode;
  book: number;
  chapter: number;
};

type BibleState = {
  versionCode: BibleVersionCode;
  lastRead: LastRead | null;

  setVersionCode: (code: BibleVersionCode) => void;
  setLastRead: (lr: LastRead) => void;
};

// Storage cross-platform (web/localStorage + native/AsyncStorage)
const storage: StateStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === "web") return localStorage.getItem(name);

    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    return await AsyncStorage.getItem(name);
  },

  setItem: async (name: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(name, value);
      return;
    }

    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.setItem(name, value);
  },

  removeItem: async (name: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(name);
      return;
    }

    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.removeItem(name);
  },
};

export const useBibleStore = create<BibleState>()(
  persist(
    (set) => ({
      versionCode: "ARA",
      lastRead: null,

      setVersionCode: (code) => set({ versionCode: code }),

      setLastRead: (lr) =>
        set({
          lastRead: lr,
          versionCode: lr.versionCode,
        }),
    }),
    {
      name: "bibleapp:bible",
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({ versionCode: s.versionCode, lastRead: s.lastRead }),
    }
  )
);