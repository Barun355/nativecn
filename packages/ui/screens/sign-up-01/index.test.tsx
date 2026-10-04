import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { useToastStore } from "@/registry/components/toast";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, useSchemeStore, type Scheme } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

import { SignUp01, type SignUp01Props } from ".";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

const hidden = { includeHiddenElements: true } as const;

async function renderBlock(props: SignUp01Props = {}, scheme: Scheme = "light") {
  await render(
    <ThemeProvider scheme={scheme}>
      <SignUp01 {...props} />
    </ThemeProvider>,
  );
}

const toasts = () =>
  useToastStore.getState().toasts.map(({ variant, title, description }) => ({
    variant,
    title,
    ...(description ? { description } : {}),
  }));

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));
const terms = () =>
  screen.getByRole("checkbox", { name: "I agree to the Terms and Privacy Policy" });

async function fill(name: string, email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText("Full name"), name);
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  useToastStore.setState({ toasts: [] });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("sign-up-01", () => {
  test("shows social on top, then the three fields, the terms checkbox and Create account", async () => {
    await renderBlock();
    expect(screen.getByRole("heading", { name: "Create an account" })).toBeTruthy();
    for (const label of ["Full name", "Email", "Password"])
      expect(screen.getByLabelText(label)).toBeTruthy();
    expect(terms().props.accessibilityState.checked).toBe(false);
    for (const name of [
      "Continue with Apple",
      "Continue with Google",
      "Terms",
      "Privacy Policy",
      "Create account",
      "Sign in",
    ])
      expect(screen.getByRole("button", { name })).toBeTruthy();
  });

  test("an empty submit shows each field's error, the terms error, and never calls onSubmit", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await press("Create account");
    expect(await screen.findByText("Enter your name", hidden)).toBeTruthy();
    expect(screen.getByText("Enter your email", hidden)).toBeTruthy();
    expect(screen.getByText("Use at least 8 characters", hidden)).toBeTruthy();
    expect(screen.getByText("Accept the Terms to continue", hidden)).toBeTruthy();
    expect(terms().props.accessibilityHint).toBe("Accept the Terms to continue");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toasts()).toEqual([]);
  });

  test("an invalid email and a short password are rejected under their fields", async () => {
    await renderBlock();
    await fill("Jane", "jane@", "short");
    await press("Create account");
    expect(await screen.findByText("Enter a valid email", hidden)).toBeTruthy();
    expect(screen.getByText("Use at least 8 characters", hidden)).toBeTruthy();
  });

  test("valid values go to onSubmit (trimmed, without the terms flag), then a success toast", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await fill(" Jane Doe ", "  jane@example.com ", "correct horse");
    await fireEvent.press(terms());
    expect(terms().props.accessibilityState.checked).toBe(true);
    await press("Create account");
    await waitFor(() =>
      expect(toasts()).toEqual([{ variant: "success", title: "Account created" }]),
    );
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "correct horse",
    });
  });

  test("an error thrown by onSubmit is shown only as an error toast", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Email already in use"));
    await renderBlock({ onSubmit });
    await fill("Jane", "jane@example.com", "correct horse");
    await fireEvent.press(terms());
    await press("Create account");
    await waitFor(() =>
      expect(toasts()).toEqual([
        {
          variant: "error",
          title: "Couldn't create your account",
          description: "Email already in use",
        },
      ]),
    );
  });

  test("FocusChain: Next on name and email, Done on password submits the form", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    expect(screen.getByLabelText("Full name").props.returnKeyType).toBe("next");
    expect(screen.getByLabelText("Email").props.returnKeyType).toBe("next");
    const password = screen.getByLabelText("Password");
    expect(password.props.returnKeyType).toBe("done");
    await fill("Jane", "jane@example.com", "correct horse");
    await fireEvent.press(terms());
    await fireEvent(password, "submitEditing");
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  test("social buttons only call onSocialSignIn; a thrown error becomes a toast", async () => {
    const onSocialSignIn = jest.fn().mockRejectedValueOnce(new Error("Cancelled"));
    await renderBlock({ onSocialSignIn });
    await press("Continue with Apple");
    await waitFor(() =>
      expect(toasts()).toEqual([
        { variant: "error", title: "Couldn't sign up", description: "Cancelled" },
      ]),
    );
    await press("Continue with Google");
    expect(onSocialSignIn.mock.calls).toEqual([["apple"], ["google"]]);
  });

  test("Terms, Privacy Policy and Sign in call their callbacks", async () => {
    const onTermsPress = jest.fn();
    const onPrivacyPress = jest.fn();
    const onSignIn = jest.fn();
    await renderBlock({ onTermsPress, onPrivacyPress, onSignIn });
    await press("Terms");
    await press("Privacy Policy");
    await press("Sign in");
    expect(onTermsPress).toHaveBeenCalledTimes(1);
    expect(onPrivacyPress).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["vega", "light"],
    ["vega", "dark"],
    ["nova", "light"],
    ["nova", "dark"],
  ] as const)("renders in %s, %s", async (style, scheme) => {
    setActiveStyle(style);
    await renderBlock({}, scheme);
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
  });
});
