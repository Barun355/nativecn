import { Stack } from "expo-router";
import { ArrowRight, BookOpen, Bot, Terminal, type LucideIcon } from "lucide-react-native";
import { Linking, View } from "react-native";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Container } from "@/components/container";
import { Icon } from "@/components/icon";
import { SchemeSwitcher } from "@/components/scheme-switcher";
import { Separator } from "@/components/separator";
import { Text } from "@/components/text";
import { createStyles } from "@/theme";

// The Preset is read from components.json, so the Your Preset card always shows this app's own.
import config from "../../components.json";

// nativecn's promo Screen (decision #25, Layout A). `nativecn-cli create` installs exactly the
// Components it imports: text, icon, button, badge, card, separator, container, segmented-tabs and
// scheme-switcher. They carry your Style (Vega or Nova); this file only arranges them. Replace this
// Screen with your own whenever you like: it is yours.

const DOCS_URL = "https://nativecn.dev/docs";

/** Next steps. Long-press a line to select and copy it. */
const NEXT_STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Terminal, title: "Add a component", text: "npx nativecn-cli add sign-in-01" },
  { icon: Bot, title: "Ask your AI agent", text: "Build a settings screen with nativecn" },
  { icon: BookOpen, title: "Read the docs", text: "nativecn.dev/docs" },
];

/** The Theme's colours shown as swatches on the Your Preset card. */
const SWATCHES = ["background", "muted", "border", "mutedForeground", "primary"] as const;

const open = (url: string) => () => {
  Linking.openURL(url).catch(() => {});
};

export default function Index() {
  const styles = useStyles();
  const swatchStyles = useSwatchStyles();
  const { preset } = config;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Container contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          {/* Your logo goes here. */}
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

        {/* Your Preset, from components.json */}
        <Card>
          <View style={styles.cardHeader}>
            <CardTitle>Your Preset</CardTitle>
            <Badge label={preset.code} variant="outline" />
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

        {/* Components */}
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
          {/* Drawn like an Input; add the input Component for a real text field. */}
          <View
            style={[styles.field, preset.style === "nova" ? styles.fieldNova : null]}
            aria-hidden
          >
            <Text variant="body" color="mutedForeground" numberOfLines={1}>
              you@example.com
            </Text>
          </View>
        </Card>

        {/* Next steps */}
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

        {/* Appearance */}
        <View style={styles.section}>
          <Text variant="label">Appearance</Text>
          <SchemeSwitcher />
        </View>
      </Container>
    </>
  );
}

type Preset = (typeof config)["preset"];

/** The Your Preset card's rows, as shown to people. */
function presetRows(preset: Preset): [string, string][] {
  const heading = preset.headingFont === "inherit" ? undefined : preset.headingFont;
  return [
    ["Style", title(preset.style)],
    ["Base colour", title(preset.baseColor)],
    ["Accent", title(preset.accentColor)],
    ["Radius", title(preset.radius)],
    [
      "Font",
      heading && heading !== preset.bodyFont
        ? `${title(preset.bodyFont)}, ${title(heading)} headings`
        : title(preset.bodyFont),
    ],
  ];
}

const WORDS: Record<string, string> = { dm: "DM", jetbrains: "JetBrains" };

/** `source-serif-4` → `Source Serif 4`, `dm-sans` → `DM Sans`. */
function title(id: string): string {
  return id
    .split("-")
    .map((w) => WORDS[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[6], paddingHorizontal: t.spacing[5], paddingBottom: t.spacing[10] },
  hero: { gap: t.spacing[3], paddingTop: t.spacing[2] },
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
  // An Input's shape from Theme Tokens: Vega's control height and radius…
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
  // …and Nova's denser ones.
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
