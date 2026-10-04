import { View } from "react-native";

import { Separator } from "@/registry/components/separator";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

export default function SeparatorDemo() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Text variant="h4">nativecn</Text>
      <Text variant="small" color="mutedForeground">
        Components for Expo apps.
      </Text>
      <Separator />
      <View style={styles.row}>
        <Text variant="small">Docs</Text>
        <Separator orientation="vertical" />
        <Text variant="small">Blocks</Text>
        <Separator orientation="vertical" />
        <Text variant="small">Themes</Text>
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  stack: { gap: t.spacing[3] },
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
}));
