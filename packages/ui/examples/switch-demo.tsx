import { useState } from "react";
import { View } from "react-native";

import { Switch } from "@/registry/components/switch";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  root: { gap: t.spacing[4] },
}));

export default function SwitchDemo() {
  const styles = useStyles();
  const [notifications, setNotifications] = useState(true);

  return (
    <View style={styles.root}>
      <Switch label="Notifications" checked={notifications} onCheckedChange={setNotifications} />
      <Switch label="Airplane mode" />
      <Switch label="Managed by your organisation" defaultChecked disabled />
    </View>
  );
}
