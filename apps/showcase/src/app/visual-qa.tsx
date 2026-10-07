import { Stack } from "expo-router";
import { Bell, Lock, Moon } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Badge } from "@/registry/components/badge";
import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { Icon } from "@/registry/components/icon";
import { Separator } from "@/registry/components/separator";
import { Switch } from "@/registry/components/switch";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

/** The agent's findings on the "before" screen, in the nativecn-visual-qa report's shape. */
const FINDINGS = [
  {
    title: "The title reads as body text",
    where: "settings, src/app/settings.tsx:18",
    cause: 'Text variant="body" on the Screen title; the design uses h2.',
    severity: "wrong",
    status: "auto-fixed",
  },
  {
    title: "Rows are not aligned",
    where: "settings, src/app/settings.tsx:24",
    cause: "Each row sets its own left padding (4, 20, 12) instead of one gap Token.",
    severity: "wrong",
    status: "auto-fixed",
  },
  {
    title: "Icons are three different sizes",
    where: "settings, src/app/settings.tsx:25",
    cause: "size sm, lg and md on Icons that sit side by side.",
    severity: "polish",
    status: "auto-fixed",
  },
  {
    title: "Save sits under the home indicator",
    where: "settings, src/app/settings.tsx:40",
    cause: "The Screen isn't wrapped in Container, so nothing keeps the safe area.",
    severity: "broken",
    status: "auto-fixed",
  },
] as const;

const ROWS = [
  { icon: Bell, label: "Notifications" },
  { icon: Moon, label: "Dark mode" },
  { icon: Lock, label: "Face ID" },
] as const;

// The Visual QA Loop (decision #21), shown as a before/after example (decision #29): a misaligned
// screen, the agent's report from its screenshots, and the screen after its auto-fixes.
export default function VisualQaScreen() {
  const styles = useStyles();
  return (
    <Container edges={["bottom"]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "The Visual QA Loop" }} />
      <Text color="mutedForeground">
        Ask your agent to &quot;check the screens&quot;. With the nativecn-visual-qa Skill it opens
        each Screen on your phone, screenshots it in light and dark, judges it against your design
        at the design-system level, fixes small safe problems and reports the rest. It never
        commits.
      </Text>

      <Step number={1} title="The screen on your phone">
        <SettingsMock fixed={false} />
      </Step>

      <Step number={2} title="The agent's report">
        <View style={styles.report}>
          <Text variant="label">Visual QA: Settings</Text>
          <Text variant="caption" color="mutedForeground">
            1 broken · 2 wrong · 1 polish; 4 auto-fixed, 0 awaiting you
          </Text>
          {FINDINGS.map((finding, i) => (
            <View key={finding.title} style={styles.finding}>
              <Separator />
              <View style={styles.findingTitle}>
                <Text variant="label" style={styles.flex}>
                  {i + 1}. {finding.title}
                </Text>
                <Badge
                  label={finding.severity}
                  variant={finding.severity === "broken" ? "destructive" : "secondary"}
                />
              </View>
              <Text variant="caption" color="mutedForeground">
                {finding.where}
              </Text>
              <Text variant="small">Root cause: {finding.cause}</Text>
              <Text variant="caption" color="success">
                {finding.status}
              </Text>
            </View>
          ))}
        </View>
      </Step>

      <Step number={3} title="The fixed screen">
        <SettingsMock fixed />
      </Step>

      <Text variant="small" color="mutedForeground">
        Navigation, logic, Theme and shared-Component changes are never auto-fixed: the agent
        reports them with the root cause and options, and waits for you.
      </Text>
    </Container>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.step}>
      <View style={styles.stepTitle}>
        <Badge label={String(number)} />
        <Text variant="h4">{title}</Text>
      </View>
      {children}
    </View>
  );
}

/**
 * A small Settings screen. Before: the problems the report lists, made deliberately. After: the
 * same screen with the agent's fixes.
 */
function SettingsMock({ fixed }: { fixed: boolean }) {
  const styles = useStyles();
  const before = [styles.rowBefore1, styles.rowBefore2, styles.rowBefore3];
  const iconSizes = ["sm", "lg", "md"] as const;
  return (
    <View
      style={[styles.phone, fixed ? styles.phoneFixed : null]}
      accessible
      aria-label={fixed ? "The fixed Settings screen" : "The Settings screen with problems"}
    >
      <Text variant={fixed ? "h2" : "body"}>Settings</Text>
      <View style={fixed ? styles.rows : null}>
        {ROWS.map((row, i) => (
          <View key={row.label} style={[styles.row, fixed ? null : before[i]]}>
            <Icon icon={row.icon} size={fixed ? "md" : iconSizes[i]} />
            <Text style={styles.flex}>{row.label}</Text>
            <Switch defaultChecked={i === 0} aria-label={row.label} />
          </View>
        ))}
      </View>
      <Button label="Save" style={fixed ? null : styles.saveBefore} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[6] },
  step: { gap: t.spacing[3] },
  stepTitle: { flexDirection: "row", alignItems: "center", gap: t.spacing[2] },
  report: {
    gap: t.spacing[2],
    padding: t.spacing[4],
    borderRadius: t.radius.lg,
    borderCurve: "continuous",
    backgroundColor: t.colors.muted,
  },
  finding: { gap: t.spacing[1] },
  findingTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[2],
    marginTop: t.spacing[2],
  },
  flex: { flex: 1 },
  phone: {
    gap: t.spacing[3],
    padding: t.spacing[4],
    paddingBottom: 0,
    borderRadius: t.radius["2xl"],
    borderCurve: "continuous",
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.border,
    backgroundColor: t.colors.background,
    overflow: "hidden",
  },
  phoneFixed: { paddingBottom: t.spacing[4] },
  rows: { gap: t.spacing[3] },
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  // The "before" screen's deliberate mistakes.
  rowBefore1: { paddingLeft: t.spacing[1] },
  rowBefore2: { paddingLeft: t.spacing[5], marginTop: t.spacing[4] },
  rowBefore3: { paddingLeft: t.spacing[3], marginTop: t.spacing[1] },
  saveBefore: { marginBottom: -t.spacing[4] },
}));
