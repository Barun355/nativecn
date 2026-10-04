import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import {
  SelectionGroup,
  useSelectionGroup,
  useSelectionItem,
  type SelectionGroupContextValue,
  type SelectionGroupProps,
} from "@/registry/components/primitives/selection-group";

function Item({ value, disabled }: { value: string; disabled?: boolean }) {
  const { itemProps } = useSelectionItem({ value, disabled });
  return (
    <Pressable testID={`item-${value}`} {...itemProps}>
      <Text>{value}</Text>
    </Pressable>
  );
}

function Group(props: SelectionGroupProps) {
  return (
    <SelectionGroup testID="group" {...props}>
      <Item value="a" />
      <Item value="b" disabled />
      <Item value="c" />
    </SelectionGroup>
  );
}

function Grab({ onGroup }: { onGroup: (group: SelectionGroupContextValue) => void }) {
  onGroup(useSelectionGroup());
  return null;
}

const item = (v: string) => screen.getByTestId(`item-${v}`);

describe("SelectionGroup (single)", () => {
  test("defaults to radiogroup / radio roles with aria-checked", async () => {
    await render(<Group defaultValue="a" />);
    expect(screen.getByTestId("group").props.role).toBe("radiogroup");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(item("a")).toBeChecked();
    expect(item("c")).not.toBeChecked();
  });

  test("tab item role gives tablist / tab with aria-selected", async () => {
    await render(<Group itemRole="tab" defaultValue="c" />);
    expect(screen.getByTestId("group").props.role).toBe("tablist");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(item("c")).toBeSelected();
    expect(item("a")).not.toBeSelected();
    expect(item("a").props.accessibilityState.checked).toBeUndefined();
  });

  test("uncontrolled: pressing an item selects it and calls onValueChange", async () => {
    const onValueChange = jest.fn();
    await render(<Group defaultValue="a" onValueChange={onValueChange} />);
    await fireEvent.press(item("c"));
    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(item("c")).toBeChecked();
    expect(item("a")).not.toBeChecked();
  });

  test("pressing the selected item does nothing", async () => {
    const onValueChange = jest.fn();
    await render(<Group defaultValue="a" onValueChange={onValueChange} />);
    await fireEvent.press(item("a"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(item("a")).toBeChecked();
  });

  test("controlled: follows value and leaves applying the change to the parent", async () => {
    const onValueChange = jest.fn();
    const { rerender } = await render(<Group value="a" onValueChange={onValueChange} />);
    await fireEvent.press(item("c"));
    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(item("a")).toBeChecked();
    await rerender(<Group value="c" onValueChange={onValueChange} />);
    expect(item("c")).toBeChecked();
    expect(item("a")).not.toBeChecked();
  });

  test("controlled by parent state", async () => {
    function Parent() {
      const [value, setValue] = useState("a");
      return <Group value={value} onValueChange={setValue} />;
    }
    await render(<Parent />);
    await fireEvent.press(item("c"));
    expect(item("c")).toBeChecked();
  });

  test("disabled items are marked, cannot be selected and are skipped", async () => {
    const onValueChange = jest.fn();
    await render(<Group defaultValue="a" onValueChange={onValueChange} />);
    expect(item("b")).toBeDisabled();
    await fireEvent.press(item("b"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(item("b")).not.toBeChecked();
  });

  test("a disabled group disables every item", async () => {
    const onValueChange = jest.fn();
    await render(<Group disabled defaultValue="a" onValueChange={onValueChange} />);
    expect(screen.getByTestId("group").props["aria-disabled"]).toBe(true);
    for (const v of ["a", "b", "c"]) expect(item(v)).toBeDisabled();
    await fireEvent.press(item("c"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("roving tab stop: on the selected item, else the first enabled one", async () => {
    const { rerender } = await render(<Group value="c" />);
    expect(item("a").props.tabIndex).toBe(-1);
    expect(item("b").props.tabIndex).toBe(-1);
    expect(item("c").props.tabIndex).toBe(0);
    await rerender(<Group value="b" />);
    expect(item("a").props.tabIndex).toBe(0);
  });

  test("move() steps through enabled items, skipping disabled ones and wrapping", async () => {
    let group!: SelectionGroupContextValue;
    const grab = (g: SelectionGroupContextValue) => (group = g);
    const onValueChange = jest.fn();
    await render(
      <SelectionGroup defaultValue="a" onValueChange={onValueChange}>
        <Item value="a" />
        <Item value="b" disabled />
        <Item value="c" />
        <Grab onGroup={grab} />
      </SelectionGroup>,
    );
    await act(async () => {
      group.move(1);
    });
    expect(onValueChange).toHaveBeenLastCalledWith("c");
    await act(async () => {
      group.move(1);
    });
    expect(onValueChange).toHaveBeenLastCalledWith("a");
    await act(async () => {
      group.move(-1);
    });
    expect(onValueChange).toHaveBeenLastCalledWith("c");
    expect(group.items.map((i) => i.value)).toEqual(["a", "b", "c"]);
  });

  test("items keep their registered order when their disabled state changes", async () => {
    let group!: SelectionGroupContextValue;
    const grab = (g: SelectionGroupContextValue) => (group = g);
    function Tree({ aDisabled }: { aDisabled: boolean }) {
      return (
        <SelectionGroup>
          <Item value="a" disabled={aDisabled} />
          <Item value="b" />
          <Grab onGroup={grab} />
        </SelectionGroup>
      );
    }
    const { rerender } = await render(<Tree aDisabled={false} />);
    await rerender(<Tree aDisabled />);
    expect(group.items).toEqual([
      expect.objectContaining({ value: "a", disabled: true }),
      expect.objectContaining({ value: "b", disabled: false }),
    ]);
  });
});

describe("SelectionGroup (multiple)", () => {
  test("defaults to group / checkbox roles with aria-checked", async () => {
    await render(<Group type="multiple" defaultValue={["a", "c"]} />);
    expect(screen.getByTestId("group").props.role).toBe("group");
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(item("a")).toBeChecked();
    expect(item("c")).toBeChecked();
    expect(item("a").props.tabIndex).toBeUndefined();
  });

  test("uncontrolled: pressing toggles items and reports the whole array", async () => {
    const onValueChange = jest.fn();
    await render(<Group type="multiple" onValueChange={onValueChange} />);
    await fireEvent.press(item("a"));
    expect(onValueChange).toHaveBeenLastCalledWith(["a"]);
    await fireEvent.press(item("c"));
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "c"]);
    expect(item("a")).toBeChecked();
    expect(item("c")).toBeChecked();
    await fireEvent.press(item("a"));
    expect(onValueChange).toHaveBeenLastCalledWith(["c"]);
    expect(item("a")).not.toBeChecked();
  });

  test("controlled: follows value", async () => {
    const onValueChange = jest.fn();
    const { rerender } = await render(
      <Group type="multiple" value={["a"]} onValueChange={onValueChange} />,
    );
    await fireEvent.press(item("c"));
    expect(onValueChange).toHaveBeenCalledWith(["a", "c"]);
    expect(item("c")).not.toBeChecked();
    await rerender(<Group type="multiple" value={["a", "c"]} onValueChange={onValueChange} />);
    expect(item("c")).toBeChecked();
  });

  test("disabled items cannot be toggled", async () => {
    const onValueChange = jest.fn();
    await render(<Group type="multiple" onValueChange={onValueChange} />);
    await fireEvent.press(item("b"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("the item role can be chosen explicitly", async () => {
    await render(<Group type="multiple" itemRole="tab" defaultValue={["a"]} />);
    expect(screen.getByTestId("group").props.role).toBe("tablist");
    expect(item("a")).toBeSelected();
  });
});

describe("useSelectionItem", () => {
  test("throws a clear error outside a SelectionGroup", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<Item value="x" />)).rejects.toThrow(/inside <SelectionGroup>/);
  });
});
