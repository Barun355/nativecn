import { Moon, Smartphone, Sun, type LucideIcon } from "lucide-react-native";
import type { Ref } from "react";
import type { StyleProp, View, ViewStyle } from "react-native";

import { Button } from "@/registry/components/button";
import {
  SegmentedTabs,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/registry/components/segmented-tabs";
import { useTheme, type SchemePreference } from "@/registry/theme";

/** The three Schemes in cycling order, with their label and icon. */
const schemes = [
  { value: "system", label: "System", icon: Smartphone },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const satisfies readonly { value: SchemePreference; label: string; icon: LucideIcon }[];

/**
 * - `segmented`: System · Light · Dark as SegmentedTabs.
 * - `icon`: one icon-only Button showing the current Scheme; each press moves to the next.
 */
export type SchemeSwitcherVariant = "segmented" | "icon";

export type SchemeSwitcherProps = {
  /** Default `segmented`. */
  variant?: SchemeSwitcherVariant;
  disabled?: boolean;
  /** Layout only, merged last onto the root. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  ref?: Ref<View>;
};

/**
 * Theme switcher / dark mode toggle: picks System, Light or Dark with the Theme's `setScheme`,
 * which persists the choice (AsyncStorage, `nativecn-theme`) and makes native chrome follow.
 */
export function SchemeSwitcher({ variant = "segmented", disabled, ...props }: SchemeSwitcherProps) {
  const { schemePreference, setScheme } = useTheme();
  const index = schemes.findIndex((s) => s.value === schemePreference);
  const current = schemes[index] ?? schemes[0];

  if (variant === "icon") {
    const next = schemes[(index + 1) % schemes.length]!;
    return (
      <Button
        variant="ghost"
        icon={current.icon}
        aria-label={`Theme: ${current.label}`}
        disabled={disabled}
        onPress={() => setScheme(next.value)}
        {...props}
      />
    );
  }

  return (
    <SegmentedTabs
      value={schemePreference}
      onValueChange={(value) => setScheme(value as SchemePreference)}
      disabled={disabled}
      {...props}
    >
      <SegmentedTabsList aria-label="Theme">
        {schemes.map((s) => (
          <SegmentedTabsTrigger key={s.value} value={s.value} label={s.label} icon={s.icon} />
        ))}
      </SegmentedTabsList>
    </SegmentedTabs>
  );
}
