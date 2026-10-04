import { fireEvent, render, screen } from "@testing-library/react-native";
import { useRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput } from "react-native";

import {
  FocusChain,
  useFocusChainField,
  type Focusable,
  type FocusChainFieldOptions,
} from "@/registry/components/primitives/focus-chain";

const focused: string[] = [];

function Field({ name, ...options }: FocusChainFieldOptions & { name: string }) {
  const ref = useRef<Focusable>({ focus: () => focused.push(name) });
  const chain = useFocusChainField(ref, options);
  const props: TextInputProps = { ...chain, multiline: options.multiline };
  return <TextInput testID={name} {...props} />;
}

const returnKey = (name: string) => screen.getByTestId(name).props.returnKeyType;
const submit = (name: string) => fireEvent(screen.getByTestId(name), "submitEditing");

beforeEach(() => {
  focused.length = 0;
});

describe("FocusChain", () => {
  test('"Next" on every field and "Done" on the last; Next moves in order, Done calls onSubmit', async () => {
    const onSubmit = jest.fn();
    await render(
      <FocusChain onSubmit={onSubmit}>
        <Field name="a" />
        <Field name="b" />
        <Field name="c" />
      </FocusChain>,
    );
    expect(["a", "b", "c"].map(returnKey)).toEqual(["next", "next", "done"]);
    expect(screen.getByTestId("a").props.submitBehavior).toBe("submit");

    await submit("a");
    await submit("b");
    expect(focused).toEqual(["b", "c"]);
    expect(onSubmit).not.toHaveBeenCalled();

    await submit("c");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("skips disabled, hidden and multiline fields", async () => {
    const onSubmit = jest.fn();
    await render(
      <FocusChain onSubmit={onSubmit}>
        <Field name="a" />
        <Field name="disabled" disabled />
        <Field name="notes" multiline />
        <Field name="b" />
        <Field name="hidden" hidden />
      </FocusChain>,
    );
    expect(returnKey("a")).toBe("next");
    expect(returnKey("b")).toBe("done");
    // Skipped fields keep their own behaviour, so a Textarea's Enter still adds a new line.
    expect(returnKey("notes")).toBeUndefined();
    expect(screen.getByTestId("notes").props.onSubmitEditing).toBeUndefined();

    await submit("a");
    expect(focused).toEqual(["b"]);
    await submit("b");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("re-labels the last field when a field becomes disabled", async () => {
    const { rerender } = await render(
      <FocusChain>
        <Field name="a" />
        <Field name="b" />
      </FocusChain>,
    );
    expect(returnKey("a")).toBe("next");
    await rerender(
      <FocusChain>
        <Field name="a" />
        <Field name="b" disabled />
      </FocusChain>,
    );
    expect(returnKey("a")).toBe("done");
  });

  test("a field's own onSubmitEditing and returnKeyType win", async () => {
    const own = jest.fn();
    await render(
      <FocusChain>
        <Field name="a" returnKeyType="search" onSubmitEditing={own} />
        <Field name="b" />
      </FocusChain>,
    );
    expect(returnKey("a")).toBe("search");
    await submit("a");
    expect(own).toHaveBeenCalledTimes(1);
    expect(focused).toEqual([]);
  });

  test("fields work normally outside a chain", async () => {
    const own = jest.fn();
    await render(<Field name="a" onSubmitEditing={own} />);
    expect(returnKey("a")).toBeUndefined();
    await submit("a");
    expect(own).toHaveBeenCalledTimes(1);
  });
});
