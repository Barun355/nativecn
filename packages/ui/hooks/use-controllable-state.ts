import { useCallback, useEffect, useRef, useState } from "react";

export type UseControllableStateParams<T> = {
  /** The controlled value. Passing anything other than `undefined` makes the state controlled. */
  value?: T;
  /** The starting value while uncontrolled. */
  defaultValue: T;
  /** Called with the next value whenever the setter changes it (in both modes). */
  onChange?: (value: T) => void;
};

export type SetControllableState<T> = (next: T | ((prev: T) => T)) => void;

/**
 * One implementation of controlled and uncontrolled values, used by every form control.
 *
 * - Controlled (`value` is not `undefined`): the returned value is always `value`; the setter
 *   only calls `onChange`, and the parent decides whether to apply it.
 * - Uncontrolled: the hook holds the value, starting at `defaultValue`, and also calls `onChange`.
 *
 * The setter is stable for the life of the component, accepts an updater function, and does
 * nothing when the next value is the same as the current one (`Object.is`).
 * In development it warns if the component switches between controlled and uncontrolled.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateParams<T>): [T, SetControllableState<T>] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : internal;

  // Latest values for the stable setter. While uncontrolled, `currentRef` is also advanced by the
  // setter itself so several calls in one event compose (an updater sees the previous result).
  // While controlled it only follows `value`, because the parent may reject the change.
  const currentRef = useRef(current);
  const controlledRef = useRef(controlled);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    currentRef.current = current;
    controlledRef.current = controlled;
    onChangeRef.current = onChange;
  });

  const wasControlled = useRef(controlled);
  useEffect(() => {
    if (__DEV__ && wasControlled.current !== controlled) {
      const from = wasControlled.current ? "controlled" : "uncontrolled";
      const to = controlled ? "controlled" : "uncontrolled";
      console.warn(
        `useControllableState: a component changed from ${from} to ${to}. ` +
          "Decide between a controlled value (`value` plus a change handler) and an uncontrolled " +
          "one (`defaultValue`) for the lifetime of the component; `value` must not become undefined.",
      );
    }
    wasControlled.current = controlled;
  }, [controlled]);

  const setValue = useCallback<SetControllableState<T>>((next) => {
    const prev = currentRef.current;
    const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : (next as T);
    if (Object.is(resolved, prev)) return;
    if (!controlledRef.current) {
      currentRef.current = resolved;
      setInternal(resolved);
    }
    onChangeRef.current?.(resolved);
  }, []);

  return [current, setValue];
}
