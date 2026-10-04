import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native";
import { createContext, use, type ReactNode, type Ref } from "react";
import { View, type ViewProps } from "react-native";

import { Icon } from "@/registry/components/icon";
import { Text, type TextColor, type TextProps } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles, type ColorRole } from "@/registry/theme";

/** Each Variant's default icon and Colour Roles: border, icon and title, description. */
const variants = {
  default: {
    icon: Info,
    border: "border",
    accent: "foreground",
    description: "mutedForeground",
  },
  destructive: {
    icon: CircleAlert,
    border: "destructive",
    accent: "destructive",
    description: "destructive",
  },
  success: { icon: CircleCheck, border: "success", accent: "success", description: "success" },
  warning: { icon: TriangleAlert, border: "warning", accent: "warning", description: "warning" },
  info: { icon: Info, border: "info", accent: "info", description: "info" },
} as const satisfies Record<
  string,
  { icon: LucideIcon; border: ColorRole; accent: TextColor & ColorRole; description: TextColor }
>;

export type AlertVariant = keyof typeof variants;

const AlertContext = createContext<AlertVariant>("default");

export type AlertProps = ViewProps & {
  /** Default `default`. */
  variant?: AlertVariant;
  /**
   * A Lucide icon component shown before the text. Each Variant has a default (Info,
   * CircleAlert, CircleCheck, TriangleAlert, Info); pass `null` for no icon.
   */
  icon?: LucideIcon | null;
  /** AlertTitle and AlertDescription, or any content. */
  children?: ReactNode;
  ref?: Ref<View>;
};

export type AlertTitleProps = Omit<TextProps, "variant" | "color">;
export type AlertDescriptionProps = Omit<TextProps, "variant" | "color">;

const useStyles = createStyles((t) => ({
  root: {
    ...slot("alert.root", t),
    flexDirection: "row",
    alignItems: "flex-start",
    borderCurve: "continuous",
    backgroundColor: t.colors.card,
  },
  // Centres the icon on the title's first line.
  icon: { height: t.type.label.lineHeight, justifyContent: "center" },
  content: { flex: 1, gap: t.spacing[1] },
}));

const useBorderStyles = createStyles((t) => ({
  default: { borderColor: t.colors.border },
  destructive: { borderColor: t.colors.destructive },
  success: { borderColor: t.colors.success },
  warning: { borderColor: t.colors.warning },
  info: { borderColor: t.colors.info },
}));

/**
 * An inline message that calls attention to something on the Screen. It is announced with the
 * `alert` role and read as one element. Never a platform dialog: use it (or `toast()`) instead
 * of `Alert.alert`. Compose with AlertTitle and AlertDescription. `style` is merged last.
 */
export function Alert({ variant = "default", icon, style, children, ...props }: AlertProps) {
  const styles = useStyles();
  const borderStyles = useBorderStyles();
  const v = variants[variant];
  const glyph = icon === undefined ? v.icon : icon;

  return (
    <AlertContext value={variant}>
      <View role="alert" accessible style={[styles.root, borderStyles[variant], style]} {...props}>
        {glyph ? (
          <View style={styles.icon}>
            <Icon icon={glyph} size="sm" color={v.accent} />
          </View>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </AlertContext>
  );
}

/** The Alert's heading line, in the Variant's colour. */
export function AlertTitle(props: AlertTitleProps) {
  const variant = use(AlertContext);
  return <Text variant="label" color={variants[variant].accent} {...props} />;
}

/** The Alert's body text. */
export function AlertDescription(props: AlertDescriptionProps) {
  const variant = use(AlertContext);
  return <Text variant="small" color={variants[variant].description} {...props} />;
}
