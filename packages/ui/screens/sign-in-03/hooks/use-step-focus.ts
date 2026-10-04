import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, type Text } from "react-native";

// Private to this Block. Each multi-step Block (sign-in-03, sign-up-02, sign-up-03) keeps its own
// copy, so it installs on its own; if a second feature needs it, move it to {hooks} (ADR 0008).

/** Lets the new step reach the screen before the screen reader is pointed at it. */
const FOCUS_DELAY_MS = 150;

/**
 * Moves screen-reader focus (VoiceOver, TalkBack) to the step's heading every time `step`
 * changes, forward or back; not on the first render, where the Screen's own focus applies.
 *
 * Put `headingRef` on the step's heading (`<Text variant="h1" ref={headingRef}>`). Pass
 * `autoFocus` to the step's first field: it is `false` while a screen reader runs, so the
 * keyboard doesn't pull focus off the heading, and `true` otherwise.
 */
export function useStepFocus(step: string) {
  const headingRef = useRef<Text>(null);
  const screenReader = useScreenReaderEnabled();
  const shown = useRef(step);

  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    const timer = setTimeout(() => {
      const heading = headingRef.current;
      if (heading) AccessibilityInfo.sendAccessibilityEvent(heading, "focus");
    }, FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step]);

  return { headingRef, autoFocus: !screenReader };
}

/** Whether VoiceOver or TalkBack is running, kept up to date. */
function useScreenReaderEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isScreenReaderEnabled().then(
      (on) => live && setEnabled(on),
      () => {},
    );
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setEnabled);
    return () => {
      live = false;
      subscription.remove();
    };
  }, []);
  return enabled;
}
