import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native";
import {
  createContext,
  isValidElement,
  use,
  useEffect,
  useRef,
  type ReactNode,
  type Ref,
} from "react";
import { View, type ViewProps } from "react-native";

import { Icon } from "@/registry/components/icon";
import { useFormField } from "@/registry/components/primitives/form-field-context";
import { Text, type TextColor, type TextProps } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles, type ColorRole } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

/**
 * Each Variant's default icon, its Colour Roles (border, icon and title, description) and the
 * prefix it is announced with. Only error (destructive) and success are announced, per the
 * Component contract; the others are read when the user reaches them.
 */
const variants = {
  default: {
    icon: Info,
    border: "border",
    accent: "foreground",
    description: "mutedForeground",
    spoken: null,
  },
  destructive: {
    icon: CircleAlert,
    border: "destructive",
    accent: "destructive",
    description: "destructive",
    spoken: "Error",
  },
  success: {
    icon: CircleCheck,
    border: "success",
    accent: "success",
    description: "success",
    spoken: "Success",
  },
  warning: {
    icon: TriangleAlert,
    border: "warning",
    accent: "warning",
    description: "warning",
    spoken: null,
  },
  info: { icon: Info, border: "info", accent: "info", description: "info", spoken: null },
} as const satisfies Record<
  string,
  {
    icon: LucideIcon;
    border: ColorRole;
    accent: TextColor & ColorRole;
    description: TextColor;
    spoken: string | null;
  }
>;

export type AlertVariant = keyof typeof variants;

/** The enclosing Alert's Variant, or `null` outside an Alert. */
const AlertContext = createContext<AlertVariant | null>(null);

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
 * The text written inside `node`, one entry per element: "Saved" and "Your changes are live."
 * for an AlertTitle and an AlertDescription. Adjacent strings and numbers stay one entry.
 */
function textParts(node: ReactNode): string[] {
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) {
    const parts: string[] = [];
    let inline = "";
    for (const child of node as ReactNode[]) {
      if (typeof child === "string" || typeof child === "number") {
        inline += String(child);
        continue;
      }
      if (inline) parts.push(inline);
      inline = "";
      parts.push(...textParts(child));
    }
    if (inline) parts.push(inline);
    return parts;
  }
  if (isValidElement<{ children?: ReactNode }>(node)) return textParts(node.props.children);
  return [];
}

/** "Error: Wrong password. Check it and try again.", the same shape as a Toast's. */
function spokenText(prefix: string, label: string | undefined, children: ReactNode): string {
  const parts = (label?.trim() ? [label] : textParts(children))
    .map((part) => part.trim())
    .filter(Boolean);
  const text = parts.reduce(
    (said, part) => (said ? `${said}${/[.!?:]$/.test(said) ? " " : ". "}${part}` : part),
    "",
  );
  return text ? `${prefix}: ${text}` : "";
}

/**
 * An inline message that calls attention to something on the Screen. It has the `alert` role
 * and is read as one element. A destructive or success Alert is also announced to screen
 * readers once when it appears and again when its text changes ("Error: …", "Success: …"),
 * unless it sits inside another Alert or inside a FormField that is announcing its error.
 * Never a platform dialog: use it (or `toast()`) instead of `Alert.alert`. Compose with
 * AlertTitle and AlertDescription. `style` is merged last.
 */
export function Alert({ variant = "default", icon, style, children, ...props }: AlertProps) {
  const styles = useStyles();
  const borderStyles = useBorderStyles();
  const v = variants[variant];
  const glyph = icon === undefined ? v.icon : icon;

  // Announced once when it appears and again when the spoken text changes, never on unrelated
  // re-renders. An enclosing Alert already speaks this text; a FormField already speaks its error.
  const nested = use(AlertContext) !== null;
  const fieldError = useFormField()?.error;
  const spoken =
    v.spoken && !nested && !fieldError ? spokenText(v.spoken, props["aria-label"], children) : "";
  const lastAnnounced = useRef("");
  useEffect(() => {
    if (spoken && spoken !== lastAnnounced.current) announce(spoken);
    lastAnnounced.current = spoken;
  }, [spoken]);

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
  const variant = use(AlertContext) ?? "default";
  return <Text variant="label" color={variants[variant].accent} {...props} />;
}

/** The Alert's body text. */
export function AlertDescription(props: AlertDescriptionProps) {
  const variant = use(AlertContext) ?? "default";
  return <Text variant="small" color={variants[variant].description} {...props} />;
}
