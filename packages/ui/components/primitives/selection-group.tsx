import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { View, type Role, type ViewProps } from "react-native";

import { useControllableState } from "@/registry/hooks/use-controllable-state";

/**
 * How the group and its items are announced:
 * - `radio`: `radiogroup` / `radio` with `aria-checked` (RadioGroup, single ChipGroup).
 * - `tab`: `tablist` / `tab` with `aria-selected` (SegmentedTabs, TabNavigation).
 * - `checkbox`: `group` / `checkbox` with `aria-checked` (multiple ChipGroup).
 */
export type SelectionItemRole = "radio" | "tab" | "checkbox";

const groupRoles: Record<SelectionItemRole, Role> = {
  radio: "radiogroup",
  tab: "tablist",
  checkbox: "group",
};

type SelectionGroupBaseProps = Omit<ViewProps, "role"> & {
  /** How the group and its items are announced. Default `radio` (single) or `checkbox` (multiple). */
  itemRole?: SelectionItemRole;
  /** Disables every item in the group. */
  disabled?: boolean;
  ref?: Ref<View>;
  children?: ReactNode;
};

export type SelectionGroupSingleProps = SelectionGroupBaseProps & {
  type?: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export type SelectionGroupMultipleProps = SelectionGroupBaseProps & {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

export type SelectionGroupProps = SelectionGroupSingleProps | SelectionGroupMultipleProps;

type RegisteredItem = { value: string; disabled: boolean };
type Registration = RegisteredItem & { key: object };

export type SelectionGroupContextValue = {
  type: "single" | "multiple";
  itemRole: SelectionItemRole;
  disabled: boolean;
  /** Selected values, in selection order (at most one when `type` is `single`). */
  selected: readonly string[];
  /** Registered items in registration (mount) order. */
  items: readonly RegisteredItem[];
  isSelected: (value: string) => boolean;
  /** Single: select `value`. Multiple: toggle `value`. Ignored for disabled items. */
  select: (value: string) => void;
  /**
   * Single only: select the enabled item `delta` steps from the current one, wrapping around
   * and skipping disabled items (arrow keys, swipes). Returns the newly selected value.
   */
  move: (delta: number) => string | undefined;
  /** The value that holds the group's single tab stop (roving tab index), if any. */
  tabStop: string | undefined;
  /** Adds or updates the item identified by `key` (any stable object). */
  register: (key: object, item: RegisteredItem) => void;
  unregister: (key: object) => void;
};

const SelectionGroupContext = createContext<SelectionGroupContextValue | null>(null);

/**
 * Behaviour-only Primitive for a group of selectable items: single choice (RadioGroup,
 * SegmentedTabs, TabNavigation, ChipGroup `single`) or multiple choice (ChipGroup `multiple`).
 * It renders a plain View carrying the group role and no visuals; items opt in with
 * `useSelectionItem`.
 */
export function SelectionGroup(props: SelectionGroupProps) {
  const {
    type = "single",
    value,
    defaultValue,
    onValueChange,
    itemRole = type === "multiple" ? "checkbox" : "radio",
    disabled = false,
    ref,
    children,
    ...rest
  } = props;

  const [selectedRaw, setSelected] = useControllableState<string | string[] | undefined>({
    value,
    defaultValue,
    onChange: onValueChange as ((next: string | string[] | undefined) => void) | undefined,
  });
  const selected = useMemo<readonly string[]>(
    () =>
      selectedRaw === undefined ? [] : Array.isArray(selectedRaw) ? selectedRaw : [selectedRaw],
    [selectedRaw],
  );

  const [items, setItems] = useState<readonly Registration[]>([]);

  // Items keep the position of their first registration, even when their value or disabled
  // state changes later.
  const register = useCallback((key: object, item: RegisteredItem) => {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.key === key);
      if (__DEV__ && prev.some((i) => i.key !== key && i.value === item.value)) {
        console.warn(`SelectionGroup: two items share the value "${item.value}".`);
      }
      const current = prev[index];
      if (!current) return [...prev, { ...item, key }];
      if (current.value === item.value && current.disabled === item.disabled) return prev;
      const next = [...prev];
      next[index] = { ...item, key };
      return next;
    });
  }, []);

  const unregister = useCallback((key: object) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const isItemDisabled = useCallback(
    (v: string) => disabled || items.some((i) => i.value === v && i.disabled),
    [disabled, items],
  );

  const select = useCallback(
    (v: string) => {
      if (isItemDisabled(v)) return;
      if (type === "multiple") {
        setSelected((prev) => {
          const list = Array.isArray(prev) ? prev : prev === undefined ? [] : [prev];
          return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
        });
      } else {
        setSelected(v);
      }
    },
    [isItemDisabled, setSelected, type],
  );

  const enabled = useMemo(
    () => (disabled ? [] : items.filter((i) => !i.disabled).map((i) => i.value)),
    [disabled, items],
  );

  const move = useCallback(
    (delta: number) => {
      if (type !== "single" || enabled.length === 0) return undefined;
      const n = enabled.length;
      const index = enabled.indexOf(selected[0] ?? "");
      const start = index === -1 ? (delta > 0 ? -1 : 0) : index;
      const next = enabled[(((start + delta) % n) + n) % n];
      setSelected(next);
      return next;
    },
    [enabled, selected, setSelected, type],
  );

  // Single choice: one tab stop, on the selected item or else the first enabled one.
  // Multiple choice: every enabled item is its own tab stop, so no single holder.
  const tabStop =
    type === "single" ? (enabled.find((v) => v === selected[0]) ?? enabled[0]) : undefined;

  const context = useMemo<SelectionGroupContextValue>(
    () => ({
      type,
      itemRole,
      disabled,
      selected,
      items,
      isSelected: (v) => selected.includes(v),
      select,
      move,
      tabStop,
      register,
      unregister,
    }),
    [type, itemRole, disabled, selected, items, select, move, tabStop, register, unregister],
  );

  return (
    <SelectionGroupContext value={context}>
      <View ref={ref} role={groupRoles[itemRole]} aria-disabled={disabled || undefined} {...rest}>
        {children}
      </View>
    </SelectionGroupContext>
  );
}

/** The nearest SelectionGroup's state, for Components that need more than one item's view. */
export function useSelectionGroup(): SelectionGroupContextValue {
  const context = use(SelectionGroupContext);
  if (!context) {
    throw new Error("useSelectionGroup() must be used inside <SelectionGroup>.");
  }
  return context;
}

export type UseSelectionItemParams = {
  value: string;
  disabled?: boolean;
};

/** Props to spread onto the item's pressable root (e.g. the Pressable Primitive). */
export type SelectionItemProps = {
  role: Role;
  "aria-checked"?: boolean;
  "aria-selected"?: boolean;
  "aria-disabled"?: boolean;
  disabled: boolean;
  tabIndex?: 0 | -1;
  onPress: () => void;
};

export type SelectionItem = {
  selected: boolean;
  disabled: boolean;
  /** Single: select this item. Multiple: toggle it. No-op while disabled. */
  select: () => void;
  itemProps: SelectionItemProps;
};

/**
 * Registers an item with the nearest SelectionGroup and returns its selected state plus the
 * role, state and press handler to spread onto its root.
 */
export function useSelectionItem({
  value,
  disabled: ownDisabled = false,
}: UseSelectionItemParams): SelectionItem {
  const group = use(SelectionGroupContext);
  if (!group) {
    throw new Error("useSelectionItem() must be used inside <SelectionGroup>.");
  }
  const { register, unregister, itemRole, isSelected, select: selectValue, tabStop, type } = group;

  const [key] = useState(() => ({}));
  useEffect(() => () => unregister(key), [unregister, key]);
  useEffect(
    () => register(key, { value, disabled: ownDisabled }),
    [register, key, value, ownDisabled],
  );

  const selected = isSelected(value);
  const disabled = group.disabled || ownDisabled;
  const select = useCallback(() => {
    if (!disabled) selectValue(value);
  }, [disabled, selectValue, value]);

  const state = itemRole === "tab" ? { "aria-selected": selected } : { "aria-checked": selected };

  return {
    selected,
    disabled,
    select,
    itemProps: {
      role: itemRole,
      ...state,
      "aria-disabled": disabled || undefined,
      disabled,
      tabIndex: type === "single" ? (tabStop === value ? 0 : -1) : undefined,
      onPress: select,
    },
  };
}
