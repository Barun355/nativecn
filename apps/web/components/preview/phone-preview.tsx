"use client";

// The shared live preview renderer (decision #28): a phone frame showing nativecn's own
// Components and Screens with react-native-web, themed by a Preset. The builder at /create uses
// it; the docs pages use docs-phone, inside the same PreviewRoot. Loaded only in the browser (see
// preset-preview).

import type { ReactNode } from "react";
import type { Preset } from "preset";

import { PreviewRoot } from "./preview-root";
import { ComponentsScreen, SignInScreen, StarterScreen } from "./screens";
import type { PreviewScheme } from "./theme";

export type PreviewTab = "components" | "sign-in" | "starter";

export type PhonePreviewProps = {
  preset: Preset;
  scheme: PreviewScheme;
  /** Called when a Component in the phone (the SchemeSwitcher) changes the Scheme. */
  onSchemeChange?: (scheme: PreviewScheme) => void;
  tab: PreviewTab;
};

const SCREENS: Record<PreviewTab, () => ReactNode> = {
  components: ComponentsScreen,
  "sign-in": SignInScreen,
  starter: StarterScreen,
};

export default function PhonePreview({ preset, scheme, onSchemeChange, tab }: PhonePreviewProps) {
  const Screen = SCREENS[tab];
  return (
    <PreviewRoot preset={preset} scheme={scheme} onSchemeChange={onSchemeChange}>
      <Screen key={tab} />
    </PreviewRoot>
  );
}
