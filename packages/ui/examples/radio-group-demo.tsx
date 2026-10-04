import { useState } from "react";
import { View } from "react-native";

import { RadioGroup, RadioGroupItem } from "@/registry/components/radio-group";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  root: { gap: t.spacing[6] },
}));

export default function RadioGroupDemo() {
  const styles = useStyles();
  const [plan, setPlan] = useState("monthly");

  return (
    <View style={styles.root}>
      <RadioGroup value={plan} onValueChange={setPlan}>
        <RadioGroupItem value="monthly" label="Monthly" />
        <RadioGroupItem value="yearly" label="Yearly" />
        <RadioGroupItem value="lifetime" label="Lifetime (sold out)" disabled />
      </RadioGroup>
      <RadioGroup defaultValue="m" orientation="horizontal">
        <RadioGroupItem value="s" label="S" />
        <RadioGroupItem value="m" label="M" />
        <RadioGroupItem value="l" label="L" />
      </RadioGroup>
    </View>
  );
}
