import { ArrowRight, Trash } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/registry/components/button";
import { createStyles } from "@/registry/theme";

/** Variants, Sizes, an icon, icon-only, loading and status. */
export default function ButtonDemo() {
  const styles = useStyles();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 800);
  };

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Button label="Primary" />
        <Button label="Secondary" variant="secondary" />
        <Button label="Outline" variant="outline" />
      </View>
      <View style={styles.row}>
        <Button label="Ghost" variant="ghost" />
        <Button label="Delete" variant="destructive" />
        <Button label="Learn more" variant="link" />
      </View>
      <View style={styles.row}>
        <Button label="Small" size="sm" />
        <Button label="Large" size="lg" />
        {/* Icon-only: aria-label is required. */}
        <Button icon={Trash} variant="outline" aria-label="Delete draft" />
      </View>
      <Button label="Continue" icon={ArrowRight} iconPosition="end" />
      {/* The screen sets and clears status; the Button never resets it. */}
      <Button
        label={saved ? "Saved" : "Save"}
        loading={saving}
        status={saved ? "success" : undefined}
        onPress={save}
      />
      <Button label="Disabled" disabled />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  stack: { gap: t.spacing[3] },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: t.spacing[2] },
}));
