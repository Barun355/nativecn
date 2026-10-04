import { View } from "react-native";

import { Avatar } from "@/registry/components/avatar";
import { createStyles } from "@/registry/theme";

export default function AvatarDemo() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Avatar size="sm" src="https://github.com/expo.png" fallback="EX" alt="Expo" />
      <Avatar src="https://github.com/shadcn.png" fallback="CN" alt="shadcn" />
      {/* No image: the initials show. */}
      <Avatar size="lg" fallback="JD" alt="Jane Doe" />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
}));
