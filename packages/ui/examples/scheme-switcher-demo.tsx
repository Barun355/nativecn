import { View } from "react-native";

import { SchemeSwitcher } from "@/registry/components/scheme-switcher";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  root: { gap: t.spacing[6] },
  icon: { alignSelf: "flex-start" },
}));

// Both Variants share the persisted Scheme: changing one updates the other.
export default function SchemeSwitcherDemo() {
  const styles = useStyles();
  return (
    <View style={styles.root}>
      <SchemeSwitcher />
      <SchemeSwitcher variant="icon" style={styles.icon} />
    </View>
  );
}
