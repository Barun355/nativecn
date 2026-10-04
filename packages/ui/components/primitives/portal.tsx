import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  SafeAreaInsetsContext,
  initialWindowMetrics,
  type EdgeInsets,
} from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";

/** The host a Portal renders into when it names none. */
export const DEFAULT_PORTAL_HOST = "root";

type PortalEntry = { key: string; layer: number; order: number; children: ReactNode };

// A tiny module-level store, so a Portal anywhere in the app (including inside a native
// modal Screen) reaches the PortalHost in the root Layout without a shared provider.
const hosts = new Map<string, PortalEntry[]>();
const listeners = new Set<() => void>();
const EMPTY: PortalEntry[] = [];
let nextOrder = 0;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function sortEntries(entries: PortalEntry[]) {
  // Higher layers draw on top; within a layer, the later registration draws on top.
  return entries.sort((a, b) => a.layer - b.layer || a.order - b.order);
}

function upsert(hostName: string, key: string, layer: number, children: ReactNode) {
  const entries = hosts.get(hostName) ?? [];
  const existing = entries.find((e) => e.key === key);
  const order = existing?.order ?? nextOrder++;
  const next = entries.filter((e) => e.key !== key);
  next.push({ key, layer, order, children });
  hosts.set(hostName, sortEntries(next));
  emit();
}

function remove(hostName: string, key: string) {
  const entries = hosts.get(hostName);
  if (!entries?.some((e) => e.key === key)) return;
  const next = entries.filter((e) => e.key !== key);
  if (next.length) hosts.set(hostName, next);
  else hosts.delete(hostName);
  emit();
}

const ZERO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const PortalInsetsContext = createContext<EdgeInsets>(ZERO_INSETS);

/**
 * The safe-area insets of the window a PortalHost covers. Portal content is drawn over the
 * whole window, so it uses these to keep clear of the notch, status bar and home indicator.
 */
export function usePortalInsets(): EdgeInsets {
  return use(PortalInsetsContext);
}

type PortalHostProps = {
  /** Which Portals this host renders. Place one default host in the root Layout. */
  name?: string;
};

/**
 * Renders every Portal that targets it, above every Screen. On iOS it draws inside
 * `FullWindowOverlay`, so it also sits above native modals (e.g. an Expo Router formSheet).
 * It has no visuals of its own and never blocks touches outside Portal content.
 */
export function PortalHost({ name = DEFAULT_PORTAL_HOST }: PortalHostProps) {
  const entries = useSyncExternalStore(
    subscribe,
    () => hosts.get(name) ?? EMPTY,
    () => EMPTY,
  );
  const insets = use(SafeAreaInsetsContext) ?? initialWindowMetrics?.insets ?? ZERO_INSETS;

  if (entries.length === 0) return null;

  const content = (
    <PortalInsetsContext value={insets}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID={`portal-host-${name}`}>
        {entries.map((entry) => (
          <View key={entry.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {entry.children}
          </View>
        ))}
      </View>
    </PortalInsetsContext>
  );

  if (Platform.OS === "ios") {
    return (
      <FullWindowOverlay unstable_accessibilityContainerViewIsModal={false}>
        {content}
      </FullWindowOverlay>
    );
  }
  return content;
}

type PortalProps = {
  children: ReactNode;
  /** The PortalHost to render into. Defaults to the root host. */
  hostName?: string;
  /** Stacking layer within the host: higher draws on top. Ties go to the later Portal. */
  layer?: number;
};

/**
 * Renders its children in a PortalHost instead of in place, so overlays (Toast, Dialog,
 * Sheet, menus) escape their Screen's layout and clipping. Renders nothing where it is used.
 */
export function Portal({ children, hostName = DEFAULT_PORTAL_HOST, layer = 0 }: PortalProps) {
  const key = useId();

  useLayoutEffect(() => {
    upsert(hostName, key, layer, children);
  }, [hostName, key, layer, children]);

  useLayoutEffect(() => () => remove(hostName, key), [hostName, key]);

  return null;
}
