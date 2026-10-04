import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import {
  useControllableState,
  type SetControllableState,
} from "@/registry/hooks/use-controllable-state";

type CounterProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onSetter?: (set: SetControllableState<number>) => void;
};

function Counter({ value, defaultValue = 0, onChange, onSetter }: CounterProps) {
  const [count, setCount] = useControllableState({ value, defaultValue, onChange });
  onSetter?.(setCount);
  return (
    <Pressable testID="counter" onPress={() => setCount((c) => c + 1)}>
      <Text testID="count">{String(count)}</Text>
    </Pressable>
  );
}

const count = () => screen.getByTestId("count").props.children;

describe("useControllableState", () => {
  test("uncontrolled: starts at defaultValue, updates itself and calls onChange", async () => {
    const onChange = jest.fn();
    await render(<Counter defaultValue={5} onChange={onChange} />);
    expect(count()).toBe("5");
    await fireEvent.press(screen.getByTestId("counter"));
    expect(count()).toBe("6");
    expect(onChange).toHaveBeenCalledWith(6);
  });

  test("controlled: shows value, calls onChange, and only changes when the parent applies it", async () => {
    const onChange = jest.fn();
    const { rerender } = await render(<Counter value={1} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId("counter"));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(count()).toBe("1");
    await rerender(<Counter value={2} onChange={onChange} />);
    expect(count()).toBe("2");
  });

  test("controlled: works with a parent that holds the state", async () => {
    function Parent() {
      const [v, setV] = useState(10);
      return <Counter value={v} onChange={setV} />;
    }
    await render(<Parent />);
    await fireEvent.press(screen.getByTestId("counter"));
    await fireEvent.press(screen.getByTestId("counter"));
    expect(count()).toBe("12");
  });

  test("the setter is stable across renders", async () => {
    const setters: SetControllableState<number>[] = [];
    const onSetter = (s: SetControllableState<number>) => setters.push(s);
    await render(<Counter onSetter={onSetter} />);
    await fireEvent.press(screen.getByTestId("counter"));
    expect(setters.length).toBeGreaterThan(1);
    expect(new Set(setters).size).toBe(1);
  });

  test("updater calls in one event compose while uncontrolled", async () => {
    const onChange = jest.fn();
    let set!: SetControllableState<number>;
    await render(<Counter onChange={onChange} onSetter={(s) => (set = s)} />);
    await act(async () => {
      set((c) => c + 1);
      set((c) => c + 1);
    });
    expect(count()).toBe("2");
    expect(onChange.mock.calls).toEqual([[1], [2]]);
  });

  test("setting the current value does not call onChange", async () => {
    const onChange = jest.fn();
    let set!: SetControllableState<number>;
    await render(<Counter defaultValue={3} onChange={onChange} onSetter={(s) => (set = s)} />);
    await act(async () => set(3));
    expect(onChange).not.toHaveBeenCalled();
  });

  test("warns in development when switching between controlled and uncontrolled", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = await render(<Counter value={1} />);
    expect(warn).not.toHaveBeenCalled();
    await rerender(<Counter />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/from controlled to uncontrolled/));
    await rerender(<Counter value={4} />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/from uncontrolled to controlled/));
    warn.mockRestore();
  });
});
