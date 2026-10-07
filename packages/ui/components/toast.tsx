import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  View,
  useWindowDimensions,
  type AccessibilityActionEvent,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { create } from "zustand";

import { Button } from "@/registry/components/button";
import { Icon } from "@/registry/components/icon";
import { Portal, usePortalInsets } from "@/registry/components/primitives/portal";
import { Text } from "@/registry/components/text";
import { useMotion } from "@/registry/hooks/use-motion";
import { slot } from "@/registry/styles";
import { createStyles, type ColorRole } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

// ---------------------------------------------------------------------------------------------
// The queue (Design System ADR 0001 allows zustand for it)
// ---------------------------------------------------------------------------------------------

export type ToastVariant = "default" | "success" | "error" | "info" | "warning";

/** A single button inside the Toast. Pressing it runs `onPress`, then dismisses the Toast. */
export type ToastAction = { label: string; onPress: () => void };

export type ToastOptions = {
  /** Reuse an id to update a Toast in place (e.g. "Saving…" → "Saved") instead of adding one. */
  id?: string;
  /** A second, quieter line under the title. */
  description?: string;
  /** Milliseconds before it dismisses itself (default 4000). `Infinity` keeps it until dismissed. */
  duration?: number;
  action?: ToastAction;
};

export type ToastData = {
  id: string;
  title: string;
  variant: ToastVariant;
  description?: string;
  duration: number;
  action?: ToastAction;
  /** Bumped when the Toast is updated in place, so it is announced again and its timer restarts. */
  version: number;
};

/** How long a Toast stays up, in ms. */
export const TOAST_DURATION = 4000;
/** How many Toasts are on screen at once; later ones wait in the queue. */
export const MAX_VISIBLE_TOASTS = 3;

type ToastState = { toasts: ToastData[] };

/** Every pending Toast, oldest first. The Toaster shows the newest `MAX_VISIBLE_TOASTS`. */
export const useToastStore = create<ToastState>()(() => ({ toasts: [] }));

let nextId = 0;

function show(title: string, variant: ToastVariant, options: ToastOptions = {}): string {
  const id = options.id ?? `toast-${++nextId}`;
  const { toasts } = useToastStore.getState();
  const existing = toasts.find((t) => t.id === id);
  const data: ToastData = {
    id,
    title,
    variant,
    description: options.description,
    duration: options.duration ?? TOAST_DURATION,
    action: options.action,
    version: existing ? existing.version + 1 : 0,
  };
  useToastStore.setState({
    toasts: existing ? toasts.map((t) => (t.id === id ? data : t)) : [...toasts, data],
  });
  return id;
}

function dismiss(id?: string): void {
  useToastStore.setState(({ toasts }) => ({
    toasts: id === undefined ? [] : toasts.filter((t) => t.id !== id),
  }));
}

type ToastFn = (title: string, options?: ToastOptions) => string;

/**
 * Show a Toast. Needs one `<Toaster />` in the root Layout. Returns the Toast's id.
 *
 * ```ts
 * toast("Saved");
 * toast.success("Profile updated");
 * toast.error("Wrong password", { description: "Check it and try again." });
 * toast("Message archived", { action: { label: "Undo", onPress: restore } });
 * toast.dismiss(id); // or toast.dismiss() for all
 * ```
 *
 * Server errors and success messages always go through `toast()`; never use `Alert.alert`.
 */
export const toast: ToastFn & {
  success: ToastFn;
  error: ToastFn;
  info: ToastFn;
  warning: ToastFn;
  /** Dismiss one Toast by id, or every Toast when called without one. */
  dismiss: (id?: string) => void;
} = Object.assign((title: string, options?: ToastOptions) => show(title, "default", options), {
  success: (title: string, options?: ToastOptions) => show(title, "success", options),
  error: (title: string, options?: ToastOptions) => show(title, "error", options),
  info: (title: string, options?: ToastOptions) => show(title, "info", options),
  warning: (title: string, options?: ToastOptions) => show(title, "warning", options),
  dismiss,
});

// ---------------------------------------------------------------------------------------------
// The Toaster
// ---------------------------------------------------------------------------------------------

const variants = {
  default: { icon: undefined, color: "foreground", spoken: "" },
  success: { icon: CircleCheck, color: "success", spoken: "Success" },
  error: { icon: CircleAlert, color: "destructive", spoken: "Error" },
  info: { icon: Info, color: "info", spoken: "Info" },
  warning: { icon: TriangleAlert, color: "warning", spoken: "Warning" },
} as const satisfies Record<
  ToastVariant,
  { icon: LucideIcon | undefined; color: ColorRole; spoken: string }
>;

/** What the screen reader says for a Toast, e.g. "Error: Wrong password. Check it and try again." */
function spokenText({ title, description, variant }: ToastData): string {
  const prefix = variants[variant].spoken;
  const text = description ? `${title}. ${description}` : title;
  return prefix ? `${prefix}: ${text}` : text;
}

/** Toasts draw above every other Portal (Dialogs, Sheets, menus). */
const TOAST_LAYER = 1000;
/** A swipe past this share of the screen width, or a fling, dismisses the Toast. */
const SWIPE_DISMISS_RATIO = 0.25;
const SWIPE_DISMISS_VELOCITY = 800;

const useStyles = createStyles((t) => ({
  viewport: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: t.spacing[2],
  },
  frame: { width: "100%", maxWidth: t.scaleValue(560) },
  // Overrides the gesture root's default `flex: 1`, so it sizes to the Toast.
  gestureRoot: { flex: 0 },
  root: {
    ...slot("toast.root", t),
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    backgroundColor: t.colors.popover,
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.border,
    borderCurve: "continuous",
  },
  content: { flex: 1, gap: t.spacing[0.5] },
  edge: { padding: t.spacing[2], paddingHorizontal: t.spacing[4] },
}));

export type ToasterProps = {
  /** Which edge the Toasts appear at (default `top`). The newest is nearest the edge. */
  position?: "top" | "bottom";
  /** The PortalHost to render into (default: the root host). */
  hostName?: string;
};

/**
 * Shows the Toasts queued by `toast()`. Render it once in the root Layout, next to the
 * `PortalHost`: it draws through the Portal above every Screen (and above native modals on iOS),
 * clear of the safe area. At most three show at once, stacked; each dismisses itself after its
 * `duration`, can be swiped away, and is announced to screen readers.
 */
export function Toaster({ position = "top", hostName }: ToasterProps) {
  return (
    <Portal hostName={hostName} layer={TOAST_LAYER}>
      <ToastViewport position={position} />
    </Portal>
  );
}

/** Reanimated reads Reduce Motion once at launch; this follows the setting live. */
function useLiveReduceMotion(): boolean | undefined {
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setEnabled(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return enabled;
}

function ToastViewport({ position }: { position: "top" | "bottom" }) {
  const styles = useStyles();
  const insets = usePortalInsets();
  const toasts = useToastStore((s) => s.toasts);
  const motion = useMotion();
  const reduced = useLiveReduceMotion() ?? motion.reduced;

  // The newest few are shown; the newest sits nearest the edge.
  const visible = toasts.slice(-MAX_VISIBLE_TOASTS);
  const ordered = position === "top" ? [...visible].reverse() : visible;

  // A plain View: taps between and around the Toasts pass through to the Screen. Never wrap this
  // in a gesture root: Android ignores `pointerEvents` on one, so it would take every tap (#153).
  return (
    <View
      pointerEvents="box-none"
      testID="toaster"
      style={[
        styles.viewport,
        styles.edge,
        position === "top" ? { top: insets.top } : { bottom: insets.bottom },
        { marginLeft: insets.left, marginRight: insets.right },
      ]}
    >
      {ordered.map((item) => (
        <ToastItem key={item.id} toast={item} position={position} reduced={reduced} />
      ))}
    </View>
  );
}

function ToastItem({
  toast: item,
  position,
  reduced,
}: {
  toast: ToastData;
  position: "top" | "bottom";
  reduced: boolean;
}) {
  const styles = useStyles();
  const motion = useMotion();
  const { width } = useWindowDimensions();
  const { id, version, duration, action } = item;
  const variant = variants[item.variant];
  const spoken = spokenText(item);

  // Announced when it appears and again when updated in place.
  useEffect(() => {
    announce(spoken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, version]);

  // Auto-dismiss, paused while a finger is on the Toast and resumed with the time left.
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  useEffect(() => {
    remaining.current = duration;
  }, [version, duration]);
  useEffect(() => {
    if (paused || !Number.isFinite(duration)) return;
    const started = Date.now();
    const timer = setTimeout(() => dismiss(id), Math.max(0, remaining.current));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, id, version, duration]);

  // Swipe sideways (either way) or towards the edge to dismiss.
  const towardEdge = position === "top" ? -1 : 1;
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const remove = () => dismiss(id);
  const pause = (on: boolean) => setPaused(on);
  const exit = reduced
    ? { duration: 0, reduceMotion: ReduceMotion.Always }
    : motion.timing("fast", "exit");
  const settle = reduced
    ? { duration: 0, reduceMotion: ReduceMotion.Always }
    : motion.spring("snappy");

  const pan = Gesture.Pan()
    .withTestId(`toast-pan-${id}`)
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      scheduleOnRN(pause, true);
    })
    .onUpdate((e) => {
      x.value = e.translationX;
      // Only towards the edge; the other way is resisted.
      y.value = towardEdge * e.translationY > 0 ? e.translationY : e.translationY / 4;
    })
    .onEnd((e) => {
      const sideways =
        Math.abs(e.translationX) > width * SWIPE_DISMISS_RATIO ||
        Math.abs(e.velocityX) > SWIPE_DISMISS_VELOCITY;
      const offEdge =
        towardEdge * e.translationY > width * SWIPE_DISMISS_RATIO * 0.5 ||
        towardEdge * e.velocityY > SWIPE_DISMISS_VELOCITY;
      if (sideways) {
        x.value = withTiming(Math.sign(e.translationX || e.velocityX) * width, exit, (done) => {
          if (done) scheduleOnRN(remove);
        });
      } else if (offEdge) {
        y.value = withTiming(towardEdge * width, exit, (done) => {
          if (done) scheduleOnRN(remove);
        });
      } else {
        x.value = withSpring(0, settle);
        y.value = withSpring(0, settle);
      }
    })
    .onFinalize(() => {
      scheduleOnRN(pause, false);
    });

  const swipeStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.abs(x.value) / width),
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  const transition = position === "top" ? "from-top" : "from-bottom";
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "dismiss" || event.nativeEvent.actionName === "escape")
      remove();
  };

  return (
    // Enter/exit/reflow animate the wrapper; the swipe moves the surface inside it.
    <Animated.View
      entering={reduced ? undefined : motion.entering(transition)}
      exiting={reduced ? undefined : motion.exiting(transition)}
      layout={reduced ? undefined : LinearTransition.duration(motion.duration("base"))}
      style={styles.frame}
    >
      {/* The swipe needs a gesture root above it, and the app's root Layout may not have one. This
          one is only as big as the Toast, so it takes no taps meant for the Screen; inside another
          gesture root it simply defers to it. */}
      <GestureHandlerRootView style={styles.gestureRoot}>
        <GestureDetector gesture={pan}>
          <Animated.View testID={`toast-${id}`} style={[styles.root, swipeStyle]}>
            {variant.icon ? <Icon icon={variant.icon} color={variant.color} /> : null}
            <View
              style={styles.content}
              accessible
              aria-label={spoken}
              accessibilityActions={[
                { name: "dismiss", label: "Dismiss" },
                { name: "escape", label: "Dismiss" },
              ]}
              onAccessibilityAction={onAccessibilityAction}
              onAccessibilityEscape={remove}
            >
              <Text variant="label" color="popoverForeground">
                {item.title}
              </Text>
              {item.description ? (
                <Text variant="small" color="mutedForeground">
                  {item.description}
                </Text>
              ) : null}
            </View>
            {action ? (
              <Button
                label={action.label}
                size="sm"
                variant="secondary"
                onPress={() => {
                  action.onPress();
                  remove();
                }}
              />
            ) : null}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Animated.View>
  );
}
