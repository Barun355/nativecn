import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { setActiveStyle } from "@/registry/styles";
import { colors, resetStyles, tokens } from "@/registry/theme";

import { DEFAULT_PRESET, decodePreset, encodePreset, presetTheme, type Preset } from "./preset";

type PresetState = {
  preset: Preset;
  hydrated: boolean;
  setPreset: (preset: Preset) => void;
};

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

/**
 * Write a Preset into the Theme's module values, as `create`/`init` write it into a user's
 * theme/colors.ts and tokens.ts, and switch the Style. Showcase only: a user's Preset is fixed
 * (ADR 0006). The radius is applied by LivePreset, since `radiusBase` is a constant.
 * Nested ThemeProviders (the dark heroes in sign-in-02 and drawer-03) read these values too.
 */
function applyPreset(preset: Preset): void {
  const theme = presetTheme(preset);
  Object.assign(colors.light, theme.colors.light);
  Object.assign(colors.dark, theme.colors.dark);
  const fonts = tokens.fonts as Mutable<typeof tokens.fonts>;
  const { letterSpacing: bodyTracking, ...body } = theme.fonts.body;
  const { letterSpacing: headingTracking, ...heading } = theme.fonts.heading;
  Object.assign(fonts.body, body);
  Object.assign(fonts.heading, heading);
  Object.assign(fonts.trackingOffset, { body: bodyTracking, heading: headingTracking });
  setActiveStyle(preset.style);
  // Cached Component styles were built from the old values.
  resetStyles();
}

/**
 * The Showcase App's live Preset, kept on the device in AsyncStorage (a non-sensitive preference,
 * ADR 0005; decision #29: only the Scheme and the Preset are stored).
 */
export const usePresetStore = create<PresetState>()(
  persist(
    (set) => ({
      preset: DEFAULT_PRESET,
      hydrated: false,
      setPreset: (preset) => {
        applyPreset(preset);
        set({ preset });
      },
    }),
    {
      name: "nativecn-showcase-preset",
      storage: createJSONStorage(() => AsyncStorage),
      // Stored as its short code, so a stale or damaged value falls back to the default Preset.
      partialize: (state) => ({ code: encodePreset(state.preset) }),
      merge: (persisted, current) => ({
        ...current,
        preset:
          decodePreset((persisted as { code?: unknown } | undefined)?.code as string) ??
          current.preset,
      }),
      onRehydrateStorage: () => (state) => {
        applyPreset(state?.preset ?? DEFAULT_PRESET);
        usePresetStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Apply a Preset live (Theme tab controls, `nativecn://preset/<code>` links). */
export const setPreset = (preset: Preset) => usePresetStore.getState().setPreset(preset);
