import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { registryIndex } from "@/registry-index";
import { createStyles } from "@/registry/theme";

const names = Object.keys(registryIndex);

// Components tab. For now: every built Registry Item from the generated index, loading its
// source on demand. Grouped, searchable detail pages follow (#29).
export default function ComponentsScreen() {
  return (
    <Screen
      title="Components"
      description={`${names.length} Registry Items, imported from packages/ui source.`}
    >
      {names.map((name) => (
        <ItemRow key={name} name={name} />
      ))}
    </Screen>
  );
}

function ItemRow({ name }: { name: string }) {
  const styles = useStyles();
  const entry = registryIndex[name]!;
  const [exports, setExports] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    entry
      .load()
      .then((mod) => setExports(Object.keys(mod).sort()))
      .catch((e: Error) => setError(e.message));
  };

  return (
    <Pressable
      role="button"
      aria-label={`${name}: load source`}
      onPress={load}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.type}>{entry.type.replace("registry:", "")}</Text>
      </View>
      <Text style={styles.description}>{entry.description}</Text>
      {exports ? <Text style={styles.exports}>Exports: {exports.join(", ")}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    padding: t.spacing[4],
    gap: t.spacing[1],
    borderRadius: t.radius.lg,
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.border,
    backgroundColor: t.colors.card,
  },
  pressed: { backgroundColor: t.colors.accent },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { ...t.type.label, color: t.colors.cardForeground },
  type: { ...t.type.caption, color: t.colors.mutedForeground },
  description: { ...t.type.body, color: t.colors.mutedForeground },
  exports: { ...t.type.caption, color: t.colors.foreground },
  error: { ...t.type.caption, color: t.colors.destructive },
}));
