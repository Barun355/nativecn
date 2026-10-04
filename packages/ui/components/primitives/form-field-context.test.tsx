import { render, screen } from "@testing-library/react-native";
import { TextInput } from "react-native";

import {
  FormFieldProvider,
  useFormField,
  type FormFieldProps,
} from "@/registry/components/primitives/form-field-context";
import { announce } from "@/registry/utils/announce";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

function Control() {
  const field = useFormField();
  return (
    <TextInput
      testID="control"
      editable={!field?.disabled}
      {...field?.accessibilityProps}
      placeholder={field?.status ?? "none"}
    />
  );
}

function Field(props: Omit<FormFieldProps, "children">) {
  return (
    <FormFieldProvider {...props}>
      <Control />
    </FormFieldProvider>
  );
}

describe("FormFieldContext", () => {
  afterEach(() => jest.mocked(announce).mockClear());

  test('reads "Email, text field, Enter a valid email": label is the name, error the description', async () => {
    await render(<Field label="Email" error="Enter a valid email" />);
    const control = screen.getByLabelText("Email");
    expect(control.props.accessibilityHint).toBe("Enter a valid email");
    expect(control.props.placeholder).toBe("error");
  });

  test("description is the hint when there is no error", async () => {
    await render(<Field label="Email" description="We never share it" />);
    expect(screen.getByLabelText("Email").props.accessibilityHint).toBe("We never share it");
  });

  test('required adds "required" to the spoken name', async () => {
    await render(<Field label="Email" required />);
    expect(screen.getByLabelText("Email, required")).toBeTruthy();
  });

  test("passes disabled and status down", async () => {
    await render(<Field label="Email" disabled status="success" />);
    const control = screen.getByTestId("control");
    expect(control.props["aria-disabled"]).toBe(true);
    expect(control.props.editable).toBe(false);
    expect(control.props.placeholder).toBe("success");
  });

  test("announces the error once when it appears", async () => {
    const { rerender } = await render(<Field label="Email" />);
    expect(announce).not.toHaveBeenCalled();

    await rerender(<Field label="Email" error="Enter a valid email" />);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Enter a valid email");

    await rerender(<Field label="Email" error="Enter a valid email" required />);
    expect(announce).toHaveBeenCalledTimes(1);

    await rerender(<Field label="Email" />);
    await rerender(<Field label="Email" error="Enter a valid email" />);
    expect(announce).toHaveBeenCalledTimes(2);
  });

  test("useFormField is null outside a FormField", async () => {
    await render(<Control />);
    expect(screen.getByTestId("control").props.placeholder).toBe("none");
  });
});
