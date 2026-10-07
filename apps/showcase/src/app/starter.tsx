import { router } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Terminal,
  type LucideIcon,
} from "lucide-react-native";
import { Linking, View } from "react-native";

import { encodePreset, optionLabel, type Preset } from "@/preset/preset";
import { usePresetStore } from "@/preset/store";
import { Badge } from "@/registry/components/badge";
import { Button } from "@/registry/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/components/card";
import { Container } from "@/registry/components/container";
import { Icon } from "@/registry/components/icon";
import { SchemeSwitcher } from "@/registry/components/scheme-switcher";
import { Separator } from "@/registry/components/separator";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

// The Starter promo Screen (decision #25, Layout A), as packages/cli/starter/src/app/index.tsx
// draws it in every new app, with two differences: a Back button, and the Your Preset card shows
// the Showcase's live Preset instead of components.json. Keep the two in step.

const DOCS_URL = "https://nativecn.dev/docs";

const NEXT_STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Terminal, title: "Add a component", text: "npx nativecn-cli add sign-in-01" },
  { icon: Bot, title: "Ask your AI agent", text: "Build a settings screen with nativecn" },
  { icon: BookOpen, title: "Read the docs", text: "nativecn.dev/docs" },
];

const SWATCHES = ["background", "muted", "border", "mutedForeground", "primary"] as const;

const open = (url: string) => () => {
  Linking.openURL(url).catch(() => {});
};

export default function StarterScreen() {
  const styles = useStyles();
  const swatchStyles = useSwatchStyles();
  const preset = usePresetStore((s) => s.preset);

  return (
    <Container contentContainerStyle={styles.content}>
      <Button
        label="Back"
        icon={ArrowLeft}
        variant="ghost"
        size="sm"
        onPress={() => router.back()}
        style={styles.back}
      />
      <View style={styles.hero}>
        <View style={styles.logo} aria-hidden>
          <Text variant="h3" color="primaryForeground">
            n
          </Text>
        </View>
        <Text variant="h1">Your app is ready.</Text>
        <Text variant="lead" color="mutedForeground">
          Built with nativecn: components you own, styled by your Preset.
        </Text>
        <View style={styles.row}>
          <Button
            label="Get started"
            icon={ArrowRight}
            iconPosition="end"
            onPress={open(`${DOCS_URL}/introduction`)}
          />
          <Button label="Docs" variant="outline" onPress={open(DOCS_URL)} />
        </View>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <CardTitle>Your Preset</CardTitle>
          <Badge label={encodePreset(preset)} variant="outline" />
        </View>
        <CardContent>
          {presetRows(preset).map(([name, value]) => (
            <View key={name} style={styles.presetRow} accessible aria-label={`${name}: ${value}`}>
              <Text variant="small" color="mutedForeground">
                {name}
              </Text>
              <Text variant="label">{value}</Text>
            </View>
          ))}
        </CardContent>
        <View style={styles.swatches} aria-hidden>
          {SWATCHES.map((role) => (
            <View key={role} style={[styles.swatch, swatchStyles[role]]} />
          ))}
        </View>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Components</CardTitle>
        </CardHeader>
        <View style={styles.sampler}>
          <Button label="Button" />
          <Button label="Outline" variant="outline" />
          <Badge label="Badge" />
          <Badge label="New" variant="outline" />
        </View>
        <View style={[styles.field, preset.style === "nova" ? styles.fieldNova : null]} aria-hidden>
          <Text variant="body" color="mutedForeground" numberOfLines={1}>
            you@example.com
          </Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text variant="h4">Next steps</Text>
        {NEXT_STEPS.map((step) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepTitle}>
              <Icon icon={step.icon} />
              <Text variant="label">{step.title}</Text>
            </View>
            <View style={styles.command}>
              <Text variant="small" selectable>
                {step.text}
              </Text>
            </View>
          </View>
        ))}
        <Text variant="caption" color="mutedForeground">
          Long-press a line to copy it.
        </Text>
      </View>

      <Separator />

      <View style={styles.section}>
        <Text variant="label">Appearance</Text>
        <SchemeSwitcher />
      </View>
    </Container>
  );
}

/** The Your Preset card's rows, as shown to people. */
function presetRows(preset: Preset): [string, string][] {
  const heading = preset.headingFont === "inherit" ? undefined : preset.headingFont;
  return [
    ["Style", optionLabel(preset.style)],
    ["Base colour", optionLabel(preset.baseColor)],
    ["Accent", optionLabel(preset.accentColor)],
    ["Radius", optionLabel(preset.radius)],
    [
      "Font",
      heading && heading !== preset.bodyFont
        ? `${optionLabel(preset.bodyFont)}, ${optionLabel(heading)} headings`
        : optionLabel(preset.bodyFont),
    ],
  ];
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[6], paddingHorizontal: t.spacing[5], paddingBottom: t.spacing[10] },
  back: { alignSelf: "flex-start", marginLeft: -t.spacing[3] },
  hero: { gap: t.spacing[3] },
  logo: {
    width: t.scaleValue(44),
    height: t.scaleValue(44),
    marginBottom: t.spacing[1],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radius.lg,
    borderCurve: "continuous",
    backgroundColor: t.colors.primary,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[3], marginTop: t.spacing[1] },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing[2],
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: t.spacing[4],
  },
  swatches: { flexDirection: "row", gap: t.scaleValue(6) },
  swatch: {
    width: t.scaleValue(22),
    height: t.scaleValue(22),
    borderRadius: t.radius.sm,
    borderCurve: "continuous",
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.border,
  },
  sampler: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: t.spacing[2] },
  field: {
    height: t.controlHeight.md,
    justifyContent: "center",
    paddingHorizontal: t.spacing[3],
    borderRadius: t.radius.md,
    borderCurve: "continuous",
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.input,
    backgroundColor: t.colors.background,
  },
  fieldNova: {
    height: t.controlHeight.sm,
    paddingHorizontal: t.scaleValue(10),
    borderRadius: t.radius.sm,
  },
  section: { gap: t.spacing[3] },
  step: { gap: t.spacing[2] },
  stepTitle: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
  command: {
    paddingHorizontal: t.spacing[3],
    paddingVertical: t.spacing[2],
    borderRadius: t.radius.md,
    borderCurve: "continuous",
    backgroundColor: t.colors.muted,
  },
}));

const useSwatchStyles = createStyles(
  (t) =>
    Object.fromEntries(
      SWATCHES.map((role) => [role, { backgroundColor: t.colors[role] }]),
    ) as Record<(typeof SWATCHES)[number], { backgroundColor: string }>,
);
