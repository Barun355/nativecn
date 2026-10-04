import { Bell, Heart, Settings } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "@/registry/components/icon";
import { createStyles } from "@/registry/theme";

/** Each size, a Colour Role, a stroke width and a labelled (meaningful) icon. */
export default function IconDemo() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Icon icon={Settings} size="sm" />
      <Icon icon={Settings} />
      <Icon icon={Settings} size="lg" />
      <Icon icon={Heart} color="destructive" strokeWidth={2.5} />
      {/* Decorative unless it carries meaning on its own: then name it. */}
      <Icon icon={Bell} color="primary" aria-label="New notifications" />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[4] },
}));
