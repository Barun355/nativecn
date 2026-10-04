import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import type { ReturnKeyTypeOptions, SubmitBehavior, TextInputProps } from "react-native";

/** Anything the chain can move focus to (a TextInput, or a Component exposing `focus()`). */
export type Focusable = { focus: () => void };

type Entry = { key: string; ref: RefObject<Focusable | null>; eligible: boolean };

function createChainStore() {
  let entries: Entry[] = [];
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    register(key: string, ref: RefObject<Focusable | null>) {
      entries = [...entries.filter((e) => e.key !== key), { key, ref, eligible: false }];
      emit();
    },
    update(key: string, eligible: boolean) {
      if (!entries.some((e) => e.key === key && e.eligible !== eligible)) return;
      entries = entries.map((e) => (e.key === key ? { ...e, eligible } : e));
      emit();
    },
    unregister(key: string) {
      entries = entries.filter((e) => e.key !== key);
      emit();
    },
    lastKey(): string | undefined {
      for (let i = entries.length - 1; i >= 0; i--)
        if (entries[i]!.eligible) return entries[i]!.key;
      return undefined;
    },
    nextAfter(key: string): Entry | undefined {
      const i = entries.findIndex((e) => e.key === key);
      return i === -1 ? undefined : entries.slice(i + 1).find((e) => e.eligible);
    },
  };
}

type ChainStore = ReturnType<typeof createChainStore>;
type ChainContextValue = { store: ChainStore; submit: () => void };

const FocusChainContext = createContext<ChainContextValue | null>(null);

export type FocusChainProps = {
  children?: ReactNode;
  /** Called when "Done" is pressed on the last field. */
  onSubmit?: () => void;
};

/**
 * Links the text fields inside it: every field's return key reads "Next" and moves to the
 * following field; the last one reads "Done" and calls `onSubmit`. Disabled, hidden and
 * multiline (Textarea) fields are skipped. Renders no views.
 *
 * Order: fields join in the order they mount, which is render (tree) order, and for a normal
 * top-to-bottom form also on-screen order. A field that mounts later (e.g. rendered
 * conditionally) joins at the end of the chain; to keep it in place, render it always and
 * toggle `hidden` instead.
 */
export function FocusChain({ children, onSubmit }: FocusChainProps) {
  const onSubmitRef = useRef(onSubmit);
  useLayoutEffect(() => {
    onSubmitRef.current = onSubmit;
  });
  const [value] = useState<ChainContextValue>(() => ({
    store: createChainStore(),
    submit: () => onSubmitRef.current?.(),
  }));
  return <FocusChainContext value={value}>{children}</FocusChainContext>;
}

export type FocusChainFieldOptions = {
  disabled?: boolean;
  /** The field is not visible; the chain skips it. */
  hidden?: boolean;
  /** Multiline fields (Textarea) are skipped so Enter keeps adding a new line. */
  multiline?: boolean;
  /** The field's own value wins over the chain's. */
  returnKeyType?: ReturnKeyTypeOptions;
  /** The field's own handler wins over the chain's. */
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  submitBehavior?: SubmitBehavior;
};

export type FocusChainFieldProps = {
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  submitBehavior?: SubmitBehavior;
};

const noopSubscribe = () => () => {};
const noLastKey = () => undefined;

/**
 * Joins a text field to the enclosing FocusChain. Spread the result onto the TextInput.
 * Outside a chain, or when the field is skipped, it returns the field's own props unchanged.
 */
export function useFocusChainField(
  ref: RefObject<Focusable | null>,
  options: FocusChainFieldOptions = {},
): FocusChainFieldProps {
  const { disabled, hidden, multiline, returnKeyType, onSubmitEditing, submitBehavior } = options;
  const chain = use(FocusChainContext);
  const key = useId();
  const eligible = !disabled && !hidden && !multiline;

  const store = chain?.store;
  useLayoutEffect(() => {
    if (!store) return;
    // Joins as ineligible; the effect below (same commit) sets eligibility.
    store.register(key, ref);
    return () => store.unregister(key);
  }, [store, key, ref]);
  useLayoutEffect(() => {
    store?.update(key, eligible);
  }, [store, key, eligible]);

  const lastKey = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.lastKey ?? noLastKey,
    store?.lastKey ?? noLastKey,
  );

  const own = { returnKeyType, onSubmitEditing, submitBehavior };
  if (!chain || !eligible) return own;

  const isLast = lastKey === key;
  const chainSubmit: TextInputProps["onSubmitEditing"] = () => {
    const next = chain.store.nextAfter(key);
    if (next) next.ref.current?.focus();
    else chain.submit();
  };
  return {
    returnKeyType: returnKeyType ?? (isLast ? "done" : "next"),
    onSubmitEditing: onSubmitEditing ?? chainSubmit,
    // Keep the keyboard up while moving to the next field; the last field blurs as usual.
    submitBehavior: submitBehavior ?? (onSubmitEditing || isLast ? undefined : "submit"),
  };
}
