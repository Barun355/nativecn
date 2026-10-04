import { useState } from "react";
import { View } from "react-native";

import { Slider } from "@/registry/components/slider";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({ root: { gap: t.spacing[4] } }));

/** A controlled volume Slider with its value shown, and an uncontrolled stepped one. */
export function SliderDemo() {
  const styles = useStyles();
  const [volume, setVolume] = useState(40);

  return (
    <View style={styles.root}>
      <Text variant="label">Volume: {volume}%</Text>
      <Slider
        aria-label="Volume"
        aria-valuetext={`${volume} percent`}
        value={volume}
        onValueChange={setVolume}
      />
      <Text variant="label">Rating</Text>
      <Slider aria-label="Rating" min={1} max={5} defaultValue={3} />
    </View>
  );
}
