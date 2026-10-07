import { View } from "react-native";

import { Pressable } from "@/registry/components/primitives/pressable";
import { SelectionGroup, useSelectionItem } from "@/registry/components/primitives/selection-group";
import { createStyles, useTheme } from "@/registry/theme";

type Swatch = { value: string; label: string; color: string };

type SwatchGroupProps = {
  /** The group's accessible name, e.g. "Accent colour". */
  label: string;
  swatches: readonly Swatch[];
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * A single choice of colour swatches (radio group) on the SelectionGroup Primitive: round
 * swatches, the chosen one ringed, each named for screen readers.
 */
export function SwatchGroup({ label, swatches, value, onValueChange }: SwatchGroupProps) {
  const styles = useStyles();
  return (
    <SelectionGroup
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      style={styles.group}
    >
      {swatches.map((swatch) => (
        <SwatchItem key={swatch.value} {...swatch} />
      ))}
    </SelectionGroup>
  );
}

function SwatchItem({ value, label, color }: Swatch) {
  const styles = useStyles();
  const { scaleValue } = useTheme();
  const { selected, itemProps } = useSelectionItem({ value });
  const size = scaleValue(36);
  return (
    <Pressable
      {...itemProps}
      aria-label={label}
      haptic="selection"
      size={{ width: size, height: size }}
      pressedStyle={styles.pressed}
      style={[styles.ring, selected && styles.ringSelected]}
    >
      <View style={[styles.swatch, { backgroundColor: color }]} />
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  group: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[2] },
  ring: {
    width: t.scaleValue(36),
    height: t.scaleValue(36),
    padding: t.scaleValue(3),
    borderRadius: t.radius.full,
    borderWidth: t.borderWidth.default * 2,
    borderColor: "transparent",
  },
  ringSelected: { borderColor: t.colors.foreground },
  swatch: {
    flex: 1,
    borderRadius: t.radius.full,
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.border,
  },
  pressed: { opacity: 0.7 },
}));
