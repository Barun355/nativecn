import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { config } from "./config";

export type SchemePreference = "system" | "light" | "dark";

type SchemeState = {
  scheme: SchemePreference;
  hydrated: boolean;
  setScheme: (scheme: SchemePreference) => void;
};

/**
 * The user's light/dark choice, persisted under `nativecn-theme` (Design System ADR 0001).
 * Only the Scheme is persisted: the Preset is a file and Scale comes from the screen.
 */
export const useSchemeStore = create<SchemeState>()(
  persist(
    (set) => ({
      scheme: config.defaultScheme,
      hydrated: false,
      setScheme: (scheme) => set({ scheme }),
    }),
    {
      name: "nativecn-theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ scheme: state.scheme }),
      onRehydrateStorage: () => () => useSchemeStore.setState({ hydrated: true }),
    },
  ),
);
