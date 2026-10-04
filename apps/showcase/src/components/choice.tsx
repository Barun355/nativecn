import { Pressable, Text } from "react-native";

import { SelectionGroup, useSelectionItem } from "@/registry/components/primitives/selection-group";
import { createStyles } from "@/registry/theme";

type ChoiceProps<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
};

/**
 * A single-choice row built on the SelectionGroup Primitive, rendered from packages/ui source.
 * Stands in for SegmentedTabs until that Component exists.
 */
export function Choice<T extends string>({ label, options, value, onValueChange }: ChoiceProps<T>) {
  const styles = useStyles();
  return (
    <SelectionGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      style={styles.group}
    >
      {options.map((option) => (
        <ChoiceItem key={option.value} value={option.value} label={option.label} />
      ))}
    </SelectionGroup>
  );
}

function ChoiceItem({ value, label }: { value: string; label: string }) {
  const styles = useStyles();
  const { selected, itemProps } = useSelectionItem({ value });
  return (
    <Pressable {...itemProps} style={[styles.item, selected && styles.itemSelected]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  group: {
    flexDirection: "row",
    padding: t.spacing[1],
    gap: t.spacing[1],
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.muted,
  },
  item: {
    flex: 1,
    minHeight: t.controlHeight.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radius.md,
  },
  itemSelected: { backgroundColor: t.colors.background },
  label: { ...t.type.label, color: t.colors.mutedForeground },
  labelSelected: { color: t.colors.foreground },
}));
