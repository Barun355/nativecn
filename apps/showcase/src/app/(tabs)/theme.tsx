import * as Clipboard from "expo-clipboard";
import { Copy, RotateCcw, Share2 } from "lucide-react-native";
import type { ReactNode } from "react";
import { Share, View } from "react-native";

import { SwatchGroup } from "@/components/swatch-group";
import { Padded, TabScreen } from "@/components/tab-screen";
import {
  DEFAULT_PRESET,
  PRESET_OPTIONS,
  createCommand,
  describePreset,
  encodePreset,
  optionLabel,
  shareMessage,
  swatchColor,
  type Preset,
} from "@/preset/preset";
import { setPreset, usePresetStore } from "@/preset/store";
import { Button } from "@/registry/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/components/card";
import { Chip, ChipGroup } from "@/registry/components/chip";
import { SchemeSwitcher } from "@/registry/components/scheme-switcher";
import {
  SegmentedTabs,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/registry/components/segmented-tabs";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";
import { createStyles, useTheme } from "@/registry/theme";

// Theme tab (decisions #29, #28): live Preset controls. Every change re-themes the whole app at
// once (see preset/live-preset.tsx) and is kept on the device. "Copy code" and "Share" hand out
// the short code; `nativecn://preset/<code>` links (the builder's QR) land here with it applied.
export default function ThemeScreen() {
  const styles = useStyles();
  const { scheme } = useTheme();
  const preset = usePresetStore((s) => s.preset);
  const code = encodePreset(preset);
  const set =
    <K extends keyof Preset>(field: K) =>
    (value: string) =>
      setPreset({ ...preset, [field]: value as Preset[K] });

  const copy = () => {
    Clipboard.setStringAsync(code).then(
      () => toast.success(`Copied ${code}`, { description: createCommand(preset) }),
      () => toast.error("Couldn't copy the code"),
    );
  };
  const share = () => {
    Share.share({ message: shareMessage(preset) }).catch(() => {});
  };

  return (
    <TabScreen title="Theme" description="Pick a Preset and watch every screen follow it.">
      <Padded>
        <Card>
          <CardHeader>
            <CardTitle>Preset {code}</CardTitle>
            <CardDescription>{describePreset(preset)}</CardDescription>
          </CardHeader>
          <CardContent style={styles.actions}>
            <Button label="Copy code" icon={Copy} size="sm" onPress={copy} />
            <Button label="Share" icon={Share2} variant="outline" size="sm" onPress={share} />
            <Button
              label="Reset"
              icon={RotateCcw}
              variant="ghost"
              size="sm"
              disabled={code === encodePreset(DEFAULT_PRESET)}
              onPress={() => setPreset(DEFAULT_PRESET)}
            />
          </CardContent>
        </Card>

        <Control label="Style">
          <SegmentedTabs value={preset.style} onValueChange={set("style")}>
            <SegmentedTabsList>
              {PRESET_OPTIONS.style.map((style) => (
                <SegmentedTabsTrigger key={style} value={style} label={optionLabel(style)} />
              ))}
            </SegmentedTabsList>
          </SegmentedTabs>
        </Control>

        <Control label="Scheme">
          <SchemeSwitcher />
        </Control>

        <Control label="Base colour" value={optionLabel(preset.baseColor)}>
          <SwatchGroup
            label="Base colour"
            value={preset.baseColor}
            onValueChange={set("baseColor")}
            swatches={PRESET_OPTIONS.baseColor.map((option) => ({
              value: option,
              label: optionLabel(option),
              color: swatchColor("baseColor", option, scheme),
            }))}
          />
        </Control>

        <Control label="Accent colour" value={optionLabel(preset.accentColor)}>
          <SwatchGroup
            label="Accent colour"
            value={preset.accentColor}
            onValueChange={set("accentColor")}
            swatches={PRESET_OPTIONS.accentColor.map((option) => ({
              value: option,
              label: optionLabel(option),
              color: swatchColor("accentColor", option, scheme),
            }))}
          />
        </Control>

        <Control label="Radius">
          <Options field="radius" value={preset.radius} onValueChange={set("radius")} />
        </Control>

        <Control label="Body font">
          <Options field="bodyFont" value={preset.bodyFont} onValueChange={set("bodyFont")} />
        </Control>

        <Control label="Heading font">
          <Options
            field="headingFont"
            value={preset.headingFont}
            onValueChange={set("headingFont")}
          />
        </Control>

        <Text variant="caption" color="mutedForeground">
          In your own app the Preset is chosen once, at create or init, and baked into the code.
          Only the Showcase switches it live.
        </Text>
      </Padded>
    </TabScreen>
  );
}

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.control}>
      <View style={styles.controlLabel}>
        <Text variant="label">{label}</Text>
        {value ? (
          <Text variant="small" color="mutedForeground">
            {value}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Options({
  field,
  value,
  onValueChange,
}: {
  field: "radius" | "bodyFont" | "headingFont";
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <ChipGroup value={value} onValueChange={onValueChange}>
      {PRESET_OPTIONS[field].map((option) => (
        <Chip key={option} value={option} label={optionLabel(option)} />
      ))}
    </ChipGroup>
  );
}

const useStyles = createStyles((t) => ({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[2] },
  control: { gap: t.spacing[3], marginTop: t.spacing[3] },
  controlLabel: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
}));
