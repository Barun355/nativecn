import { useEffect, useState } from "react";
import { View } from "react-native";

import { Progress } from "@/registry/components/progress";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  stack: { gap: t.spacing[6] },
}));

/** A determinate bar that fills up, and an indeterminate one. */
export default function ProgressDemo() {
  const styles = useStyles();
  const [value, setValue] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setValue(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.stack}>
      <Progress value={value} accessibilityHint="Upload progress" />
      <Progress indeterminate />
    </View>
  );
}
