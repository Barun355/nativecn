import { View } from "react-native";

import { Button } from "@/registry/components/button";
import { toast } from "@/registry/components/toast";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({ root: { gap: t.spacing[3] } }));

// Needs <PortalHost /> and <Toaster /> in the root Layout (`init` and `create` add both).
export default function ToastDemo() {
  const styles = useStyles();
  return (
    <View style={styles.root}>
      <Button label="Default" variant="outline" onPress={() => toast("Draft saved")} />
      <Button label="Success" variant="outline" onPress={() => toast.success("Profile updated")} />
      <Button
        label="Error"
        variant="outline"
        onPress={() => toast.error("Wrong password", { description: "Check it and try again." })}
      />
      <Button
        label="With action"
        variant="outline"
        onPress={() =>
          toast("Message archived", {
            action: { label: "Undo", onPress: () => toast.info("Message restored") },
          })
        }
      />
      <Button label="Dismiss all" variant="ghost" onPress={() => toast.dismiss()} />
    </View>
  );
}
