import { useState } from "react";
import { View } from "react-native";

import { Checkbox } from "@/registry/components/checkbox";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  root: { gap: t.spacing[4] },
  nested: { gap: t.spacing[3], paddingLeft: t.spacing[6] },
}));

const TOPPINGS = ["Cheese", "Olives", "Basil"];

export default function CheckboxDemo() {
  const styles = useStyles();
  const [picked, setPicked] = useState<string[]>(["Cheese"]);
  const all = picked.length === TOPPINGS.length;

  return (
    <View style={styles.root}>
      <Checkbox label="Accept the terms" defaultChecked />
      <Checkbox
        label="All toppings"
        checked={all}
        indeterminate={picked.length > 0 && !all}
        onCheckedChange={(checked) => setPicked(checked ? TOPPINGS : [])}
      />
      <View style={styles.nested}>
        {TOPPINGS.map((topping) => (
          <Checkbox
            key={topping}
            label={topping}
            checked={picked.includes(topping)}
            onCheckedChange={(checked) =>
              setPicked((prev) =>
                checked ? [...prev, topping] : prev.filter((p) => p !== topping),
              )
            }
          />
        ))}
      </View>
      <Checkbox label="Unavailable" disabled />
    </View>
  );
}
