import type { LucideIcon } from "lucide-react-native";
import type { ReactNode, Ref } from "react";
import { View, type ViewProps } from "react-native";

import { Icon } from "@/registry/components/icon";
import { Text } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

export type EmptyStateProps = Omit<ViewProps, "children"> & {
  /** A Lucide icon component, drawn in a soft circle above the title. */
  icon?: LucideIcon;
  /** What is empty, e.g. "No messages yet". Read as a heading. */
  title: string;
  /** What the user can do about it. */
  description?: string;
  /** The action, usually a Button. */
  children?: ReactNode;
  ref?: Ref<View>;
};

const useStyles = createStyles((t) => ({
  root: { ...slot("empty-state.root", t), alignItems: "center", justifyContent: "center" },
  icon: {
    ...slot("empty-state.icon", t),
    borderRadius: t.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.muted,
  },
  text: { alignItems: "center", gap: t.spacing[1] },
  action: { marginTop: t.spacing[2] },
}));

/**
 * What a Screen or list shows when there is nothing to show yet: an icon, a title, a short
 * description and an optional action (`children`). The title is a heading. `style` is merged
 * last.
 */
export function EmptyState({
  icon,
  title,
  description,
  children,
  style,
  ...props
}: EmptyStateProps) {
  const styles = useStyles();

  return (
    <View style={[styles.root, style]} {...props}>
      {icon ? (
        <View style={styles.icon}>
          <Icon icon={icon} size="lg" color="mutedForeground" />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="h4" align="center">
          {title}
        </Text>
        {description ? (
          <Text variant="small" color="mutedForeground" align="center">
            {description}
          </Text>
        ) : null}
      </View>
      {children != null ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}
