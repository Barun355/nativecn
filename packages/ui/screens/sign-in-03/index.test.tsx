import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { BackHandler } from "react-native";

import { useToastStore } from "@/registry/components/toast";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, useSchemeStore, type Scheme } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

import { SignIn03, type SignIn03Props } from ".";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

const hidden = { includeHiddenElements: true } as const;

async function renderBlock(props: SignIn03Props = {}, scheme: Scheme = "light") {
  await render(
    <ThemeProvider scheme={scheme}>
      <SignIn03 {...props} />
    </ThemeProvider>,
  );
}

const toasts = () =>
  useToastStore.getState().toasts.map(({ variant, title, description }) => ({
    variant,
    title,
    ...(description ? { description } : {}),
  }));

const heading = (name: string) => screen.findByRole("heading", { name });
const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

/** Fills in the email and moves on to the password step. */
async function toPassword() {
  await fireEvent.changeText(screen.getByLabelText("Email"), " jane@example.com ");
  await press("Continue");
  await heading("Enter your password");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  useToastStore.setState({ toasts: [] });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("sign-in-03", () => {
  test("starts on the email step, without a Back button", async () => {
    await renderBlock();
    expect(screen.getByRole("heading", { name: "What's your email?" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  test("Continue checks the email under the field before moving on", async () => {
    await renderBlock();
    await press("Continue");
    expect(await screen.findByText("Enter your email", hidden)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Email"), "jane@");
    await press("Continue");
    expect(await screen.findByText("Enter a valid email", hidden)).toBeTruthy();
  });

  test("password step: names the email, has an icon-only Back, and submits the password", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await toPassword();
    expect(screen.getByText("for jane@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();

    await press("Sign in");
    expect(await screen.findByText("Password is required", hidden)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    await fireEvent(screen.getByLabelText("Password"), "submitEditing");
    await waitFor(() => expect(toasts()).toEqual([{ variant: "success", title: "Signed in" }]));
    expect(onSubmit).toHaveBeenCalledWith({
      method: "password",
      email: "jane@example.com",
      password: "secret",
    });
  });

  test("Back returns to the email step with the email kept", async () => {
    await renderBlock();
    await toPassword();
    await press("Back");
    await heading("What's your email?");
    expect(screen.getByLabelText("Email").props.value).toBe(" jane@example.com ");
  });

  test("Android's back button steps back through the form first", async () => {
    const listen = jest.spyOn(BackHandler, "addEventListener");
    await renderBlock();
    expect(listen).not.toHaveBeenCalled();
    await toPassword();
    const handler = listen.mock.calls.at(-1)![1];
    let handled: boolean | null | undefined;
    await act(async () => {
      handled = handler({} as Parameters<typeof handler>[0]);
    });
    expect(handled).toBe(true);
    await heading("What's your email?");
    listen.mockRestore();
  });

  test("Email me a code instead: onSendCode, a toast, then the code step", async () => {
    const onSendCode = jest.fn();
    const onSubmit = jest.fn();
    await renderBlock({ onSendCode, onSubmit });
    await toPassword();
    await press("Email me a code instead");
    await heading("Check your email");
    expect(onSendCode).toHaveBeenCalledWith("jane@example.com");
    expect(toasts()).toEqual([
      { variant: "success", title: "Code sent", description: "Check jane@example.com" },
    ]);
    expect(screen.getByText("Enter the 6-digit code sent to jane@example.com")).toBeTruthy();

    await press("Verify");
    expect(await screen.findByText("Enter the 6-digit code", hidden)).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Verification code, 6 digits"), "123456");
    await press("Verify");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        method: "code",
        email: "jane@example.com",
        code: "123456",
      }),
    );
  });

  test("Resend sends the code again", async () => {
    const onSendCode = jest.fn();
    await renderBlock({ onSendCode });
    await toPassword();
    await press("Email me a code instead");
    await heading("Check your email");
    await press("Resend");
    await waitFor(() => expect(onSendCode).toHaveBeenCalledTimes(2));
  });

  test("errors from onSendCode and onSubmit are shown only as toasts", async () => {
    const onSendCode = jest.fn().mockRejectedValue(new Error("Rate limited"));
    const onSubmit = jest.fn().mockRejectedValue(new Error("Wrong password"));
    await renderBlock({ onSendCode, onSubmit });
    await toPassword();
    await press("Email me a code instead");
    await waitFor(() =>
      expect(toasts()).toEqual([
        { variant: "error", title: "Couldn't send the code", description: "Rate limited" },
      ]),
    );
    expect(screen.getByRole("heading", { name: "Enter your password" })).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Password"), "nope");
    await press("Sign in");
    await waitFor(() =>
      expect(toasts()[1]).toEqual({
        variant: "error",
        title: "Couldn't sign in",
        description: "Wrong password",
      }),
    );
  });

  test.each([
    ["vega", "light"],
    ["vega", "dark"],
    ["nova", "light"],
    ["nova", "dark"],
  ] as const)("renders in %s, %s", async (style, scheme) => {
    setActiveStyle(style);
    await renderBlock({}, scheme);
    await toPassword();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });
});
