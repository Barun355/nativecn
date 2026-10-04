import { View } from "react-native";

import { Spinner } from "@/registry/components/spinner";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[6] },
}));

/** The three sizes, a Colour Role and a specific accessible name. */
export default function SpinnerDemo() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" color="primary" aria-label="Loading messages" />
    </View>
  );
}
