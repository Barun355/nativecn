import { Terminal } from "lucide-react-native";
import { View } from "react-native";

import { Alert, AlertDescription, AlertTitle } from "@/registry/components/alert";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  stack: { gap: t.spacing[4] },
}));

/** Every Variant with its default icon, and one with a custom icon. */
export default function AlertDemo() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Alert icon={Terminal}>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>You can add Components to your app with the CLI.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Check your card details and try again.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Profile saved</AlertTitle>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Storage almost full</AlertTitle>
        <AlertDescription>You have used 90% of your space.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertDescription>A new version is available.</AlertDescription>
      </Alert>
    </View>
  );
}
