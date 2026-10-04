import { View } from "react-native";

import { Badge } from "@/registry/components/badge";
import { createStyles } from "@/registry/theme";

export default function BadgeDemo() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Badge label="New" />
      <Badge label="Beta" variant="secondary" />
      <Badge label="Draft" variant="outline" />
      <Badge label="Failed" variant="destructive" />
      <Badge label="Paid" variant="success" />
      <Badge label="Pending" variant="warning" />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[2] },
}));
