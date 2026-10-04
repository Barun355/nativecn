import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { useToastStore } from "@/registry/components/toast";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, useSchemeStore, type Scheme } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

import { SignIn01, type SignIn01Props } from ".";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

const hidden = { includeHiddenElements: true } as const;

async function renderBlock(props: SignIn01Props = {}, scheme: Scheme = "light") {
  await render(
    <ThemeProvider scheme={scheme}>
      <SignIn01 {...props} />
    </ThemeProvider>,
  );
}

const toasts = () =>
  useToastStore.getState().toasts.map(({ variant, title, description }) => ({
    variant,
    title,
    ...(description ? { description } : {}),
  }));

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  useToastStore.setState({ toasts: [] });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("sign-in-01", () => {
  test("shows the logo, heading, both fields, sign-in and both social buttons", async () => {
    await renderBlock();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    for (const name of [
      "Sign in",
      "Forgot password?",
      "Continue with Apple",
      "Continue with Google",
      "Sign up",
    ])
      expect(screen.getByRole("button", { name })).toBeTruthy();
  });

  test("an empty submit shows each field's error and never calls onSubmit", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email", hidden)).toBeTruthy();
    expect(screen.getByText("Password is required", hidden)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toasts()).toEqual([]);
  });

  test("an invalid email is rejected under the field", async () => {
    await renderBlock();
    await fill("jane@", "secret");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email", hidden)).toBeTruthy();
  });

  test("valid values go to onSubmit (email trimmed), then a success toast", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await fill("  jane@example.com ", "secret");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(toasts()).toEqual([{ variant: "success", title: "Signed in" }]));
    expect(onSubmit).toHaveBeenCalledWith({ email: "jane@example.com", password: "secret" });
  });

  test("an error thrown by onSubmit is shown only as an error toast", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Wrong email or password"));
    await renderBlock({ onSubmit });
    await fill("jane@example.com", "wrong");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(toasts()).toEqual([
        { variant: "error", title: "Couldn't sign in", description: "Wrong email or password" },
      ]),
    );
  });

  test("FocusChain: Next on email, Done on password submits the form", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    expect(screen.getByLabelText("Email").props.returnKeyType).toBe("next");
    const password = screen.getByLabelText("Password");
    expect(password.props.returnKeyType).toBe("done");
    await fill("jane@example.com", "secret");
    await fireEvent(password, "submitEditing");
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  test("social buttons only call onSocialSignIn; a thrown error becomes a toast", async () => {
    const onSocialSignIn = jest.fn().mockRejectedValueOnce(new Error("Cancelled"));
    await renderBlock({ onSocialSignIn });
    await fireEvent.press(screen.getByRole("button", { name: "Continue with Apple" }));
    await waitFor(() =>
      expect(toasts()).toEqual([
        { variant: "error", title: "Couldn't sign in", description: "Cancelled" },
      ]),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
    expect(onSocialSignIn.mock.calls).toEqual([["apple"], ["google"]]);
  });

  test("Forgot password and Sign up call their callbacks", async () => {
    const onForgotPassword = jest.fn();
    const onSignUp = jest.fn();
    await renderBlock({ onForgotPassword, onSignUp });
    await fireEvent.press(screen.getByRole("button", { name: "Forgot password?" }));
    await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));
    expect(onForgotPassword).toHaveBeenCalledTimes(1);
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["vega", "light"],
    ["vega", "dark"],
    ["nova", "light"],
    ["nova", "dark"],
  ] as const)("renders in %s, %s", async (style, scheme) => {
    setActiveStyle(style);
    await renderBlock({}, scheme);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });
});
