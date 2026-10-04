import { Text, View, type TextStyle, type ViewStyle } from "react-native";

import { Choice } from "@/components/choice";
import { Screen } from "@/components/screen";
import { setActiveStyle, slot, STYLES, useActiveStyle, type StyleName } from "@/registry/styles";
import { createStyles, useTheme, type SchemePreference } from "@/registry/theme";

const styleOptions = (Object.keys(STYLES) as StyleName[]).map((name) => ({
  value: name,
  label: name[0]!.toUpperCase() + name.slice(1),
}));

const schemeOptions: { value: SchemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Theme tab. For now: the live Vega ↔ Nova switch (repo-only `setActiveStyle`, ADR 0006) and
// the Scheme. The full Preset controls and `nativecn://preset/<code>` deep links follow (#29, #28).
export default function ThemeScreen() {
  const style = useActiveStyle();
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Screen title="Theme" description="Switch Style and Scheme live.">
      <Text style={styles.heading}>Style</Text>
      <Choice label="Style" options={styleOptions} value={style} onValueChange={setActiveStyle} />
      <Text style={styles.heading}>Scheme</Text>
      <Choice
        label="Scheme"
        options={schemeOptions}
        value={theme.schemePreference}
        onValueChange={theme.setScheme}
      />
      <Text style={styles.heading}>Preview</Text>
      {/* `key` remounts the preview so its slot() styles are rebuilt for the new Style. */}
      <StylePreview key={style} />
    </Screen>
  );
}

function StylePreview() {
  const styles = usePreviewStyles();
  return (
    <View style={styles.button} role="none">
      <Text style={styles.label}>Button in {useActiveStyle()}</Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  heading: { ...t.type.label, color: t.colors.foreground, marginTop: t.spacing[2] },
}));

// Reads the active Style's Slot fills, as base Components do. setActiveStyle() clears this cache.
// slot() is typed as the union of every Slot's fill, so each use is narrowed to its style type.
const usePreviewStyles = createStyles((t) => ({
  button: {
    ...(slot("button.root", t) as ViewStyle),
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.primary,
  },
  label: { ...(slot("button.label", t) as TextStyle), color: t.colors.primaryForeground },
}));
