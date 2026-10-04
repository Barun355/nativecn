import { AccessibilityInfo, Platform } from "react-native";

export type AnnounceOptions = {
  /**
   * Wait for the screen reader to finish what it is saying instead of cutting it off.
   * Default `true`, so an announcement made right after a press is not lost behind the
   * button's own label. Pass `false` to interrupt. TalkBack always queues, so this only
   * changes VoiceOver.
   */
  queue?: boolean;
};

/**
 * VoiceOver drops announcements posted in the same moment as a focus or layout change
 * (a press, a field blurring, a Toast mounting). A short delay lets the change settle first.
 */
const IOS_DELAY_MS = 150;

/**
 * Speak `message` with the screen reader (VoiceOver or TalkBack). A no-op for empty or
 * whitespace-only messages, and harmless when no screen reader is running.
 *
 * Use it for things that appear without moving focus: a form error, a Button's `status`,
 * a Toast.
 */
export function announce(message: string, { queue = true }: AnnounceOptions = {}): void {
  const text = message.trim();
  if (!text) return;

  if (Platform.OS !== "ios") {
    AccessibilityInfo.announceForAccessibility(text);
    return;
  }

  setTimeout(() => {
    if (typeof AccessibilityInfo.announceForAccessibilityWithOptions === "function") {
      AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue });
    } else {
      AccessibilityInfo.announceForAccessibility(text);
    }
  }, IOS_DELAY_MS);
}
