import { View } from "react-native";

import { Skeleton } from "@/registry/components/skeleton";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[4] },
  lines: { flex: 1, gap: t.spacing[2] },
}));

/** A list row while it loads: an avatar circle and two lines of text, announced busy once. */
export default function SkeletonDemo() {
  const styles = useStyles();
  return (
    <View style={styles.row} accessible aria-busy aria-label="Loading profile">
      <Skeleton circle height={48} />
      <View style={styles.lines}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="45%" height={16} />
      </View>
    </View>
  );
}
