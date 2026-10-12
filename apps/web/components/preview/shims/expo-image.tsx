// Web stand-in for expo-image in the preview: React Native's Image, with expo-image's
// `contentFit` mapped to `resizeMode` (the only expo-image props nativecn's Avatar uses).
import { Image as RNImage, type ImageProps as RNImageProps } from "react-native";

type ContentFit = "cover" | "contain" | "fill" | "none" | "scale-down";

const RESIZE_MODE = {
  cover: "cover",
  contain: "contain",
  fill: "stretch",
  none: "center",
  "scale-down": "contain",
} as const satisfies Record<ContentFit, RNImageProps["resizeMode"]>;

export type ImageProps = RNImageProps & { contentFit?: ContentFit };

export function Image({ contentFit = "cover", ...props }: ImageProps) {
  return <RNImage resizeMode={RESIZE_MODE[contentFit]} {...props} />;
}
