import { View } from "react-native";

import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((tk) => ({
  root: slot("sample.root", tk),
  pressed: slot("sample.pressed", tk),
}));

export function Sample() {
  const styles = useStyles();
  return <View style={styles.root} />;
}
