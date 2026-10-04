import { View } from "react-native";

import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

/** The type ramp, text Colour Roles and alignment. */
export default function TextDemo() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Text variant="h1">Welcome back</Text>
      <Text variant="lead" color="mutedForeground">
        Pick up where you left off.
      </Text>
      <Text>Body text is selectable by default, so people can copy it.</Text>
      <Text variant="small" color="mutedForeground">
        Last synced 2 minutes ago
      </Text>
      <Text variant="caption" color="destructive">
        Your trial ends tomorrow
      </Text>
      <Text variant="label" align="center">
        Centred label
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  stack: { gap: t.spacing[2] },
}));
