import { Image } from "expo-image";
import { useState, type Ref } from "react";
import { View, type ViewProps } from "react-native";

import { Text } from "@/registry/components/text";
import { slot } from "@/registry/styles";
import { createStyles } from "@/registry/theme";

/** The Style sets each size before Scale: Vega sm 32 · md 40 · lg 64, Nova sm 24 · md 32 · lg 48. */
export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = Omit<ViewProps, "children"> & {
  /** The image URI. While it loads, or if it fails, the `fallback` shows instead. */
  src?: string;
  /** Initials (or any short text) shown when there is no image, e.g. `"JD"`. */
  fallback?: string;
  /** Default `md`. */
  size?: AvatarSize;
  /**
   * Who the avatar shows, e.g. `"Jane Doe"`. Makes it an image for screen readers; without it
   * the avatar is decorative and hidden (the name is usually already next to it).
   */
  alt?: string;
  ref?: Ref<View>;
};

/** Initials take 40% of the avatar's side; the line height leaves room for descenders. */
const initials = (side: number) => ({ fontSize: side * 0.4, lineHeight: side * 0.5 });

const useStyles = createStyles((t) => {
  const md = slot("avatar.root", t);
  const sm = slot("avatar.sm", t);
  const lg = slot("avatar.lg", t);
  return {
    root: {
      ...md,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.muted,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    sm,
    md: {},
    lg,
    fallbackSm: initials(sm.height),
    fallbackMd: initials(md.height),
    fallbackLg: initials(lg.height),
    image: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  };
});

const fallbackStyle = { sm: "fallbackSm", md: "fallbackMd", lg: "fallbackLg" } as const;

/**
 * A round user image loaded with expo-image, with the `fallback` initials behind it while it
 * loads or when it fails. Decorative unless `alt` is given. `style` is merged last.
 */
export function Avatar({ src, fallback, size = "md", alt, style, ...props }: AvatarProps) {
  const styles = useStyles();
  // Remember which URI failed rather than a flag, so a recycled row (FlashList) with a new
  // `src` tries again without an effect.
  const [failed, setFailed] = useState<string>();
  const showImage = !!src && src !== failed;
  const decorative = !alt;

  return (
    <View
      role={decorative ? undefined : "img"}
      aria-label={alt}
      aria-hidden={decorative}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
      style={[styles.root, styles[size], style]}
      {...props}
    >
      {fallback ? (
        <Text
          variant="label"
          color="mutedForeground"
          numberOfLines={1}
          allowFontScaling={false}
          style={styles[fallbackStyle[size]]}
        >
          {fallback}
        </Text>
      ) : null}
      {showImage ? (
        <Image
          source={{ uri: src }}
          contentFit="cover"
          accessible={false}
          onError={() => setFailed(src)}
          style={styles.image}
          testID={props.testID ? `${props.testID}-image` : undefined}
        />
      ) : null}
    </View>
  );
}
