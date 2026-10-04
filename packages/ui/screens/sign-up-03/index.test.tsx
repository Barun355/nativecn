import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, BackHandler } from "react-native";

import { useToastStore } from "@/registry/components/toast";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, useSchemeStore, type Scheme } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

import { SignUp03, type SignUp03Props } from ".";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

const hidden = { includeHiddenElements: true } as const;

async function renderBlock(props: SignUp03Props = {}, scheme: Scheme = "light") {
  await render(
    <ThemeProvider scheme={scheme}>
      <SignUp03 {...props} />
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

/** Every screen-reader focus move (`AccessibilityInfo.sendAccessibilityEvent`, mocked by jest). */
const focusMoves = jest.mocked(AccessibilityInfo.sendAccessibilityEvent);
/** Where the last focus move landed: the event, and the element's role and text. */
function lastFocus() {
  const [target, event] = focusMoves.mock.calls.at(-1) ?? [];
  const { role, children } =
    (target as { props?: { role?: string; children?: unknown } })?.props ?? {};
  return { event, role, name: children };
}
const expectFocusOn = (name: string) =>
  waitFor(() => expect(lastFocus()).toEqual({ event: "focus", role: "heading", name }));
const screenReader = (on: boolean) =>
  jest.mocked(AccessibilityInfo.isScreenReaderEnabled).mockResolvedValue(on);

/** Presses Android's back button through the listener the Block registered last. */
async function androidBack(listen: jest.SpyInstance) {
  const handler = listen.mock.calls.at(-1)![1] as () => boolean | null | undefined;
  await act(async () => {
    handler();
  });
}

/** Opens the email field, fills it in and sends the code. */
async function toCode() {
  await press("Sign up with email");
  await fireEvent.changeText(screen.getByLabelText("Email"), " jane@example.com ");
  await press("Send code");
  await heading("Check your inbox");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  useToastStore.setState({ toasts: [] });
  jest.mocked(announce).mockClear();
  focusMoves.mockClear();
  screenReader(false);
});

afterEach(() => setActiveStyle("vega"));

describe("sign-up-03", () => {
  test("leads with the brand and Apple and Google; the email field is hidden at first", async () => {
    await renderBlock();
    expect(screen.getByRole("heading", { name: "Get started" })).toBeTruthy();
    for (const name of ["Continue with Apple", "Continue with Google", "Sign up with email"])
      expect(screen.getByRole("button", { name })).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.queryByLabelText("Password")).toBeNull();
  });

  test("Sign up with email reveals the email field; Send code checks it first", async () => {
    const onSendCode = jest.fn();
    await renderBlock({ onSendCode });
    await press("Sign up with email");
    expect(screen.queryByRole("button", { name: "Sign up with email" })).toBeNull();
    await press("Send code");
    expect(await screen.findByText("Enter your email", hidden)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Email"), "jane@");
    await press("Send code");
    expect(await screen.findByText("Enter a valid email", hidden)).toBeTruthy();
    expect(onSendCode).not.toHaveBeenCalled();
  });

  test("Send code: onSendCode with the trimmed email, a toast, then the code step with Back", async () => {
    const onSendCode = jest.fn();
    await renderBlock({ onSendCode });
    await toCode();
    expect(onSendCode).toHaveBeenCalledWith("jane@example.com");
    expect(toasts()).toEqual([
      { variant: "success", title: "Code sent", description: "Check jane@example.com" },
    ]);
    expect(screen.getByText("Enter the 6-digit code sent to jane@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });

  test("Done on the email field sends the code too (FocusChain)", async () => {
    const onSendCode = jest.fn();
    await renderBlock({ onSendCode });
    await press("Sign up with email");
    const field = screen.getByLabelText("Email");
    expect(field.props.returnKeyType).toBe("done");
    await fireEvent.changeText(field, "jane@example.com");
    await fireEvent(field, "submitEditing");
    await heading("Check your inbox");
    expect(onSendCode).toHaveBeenCalledTimes(1);
  });

  test("the code is checked, then onSubmit gets the email and code and a success toast shows", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await toCode();
    await press("Create account");
    expect(await screen.findByText("Enter the 6-digit code", hidden)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Verification code, 6 digits"), "123456");
    await press("Create account");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: "jane@example.com", code: "123456" }),
    );
    expect(toasts().at(-1)).toEqual({ variant: "success", title: "Account created" });
  });

  test("Back returns to the email field with the email kept; Resend sends again", async () => {
    const onSendCode = jest.fn();
    await renderBlock({ onSendCode });
    await toCode();
    await press("Resend");
    await waitFor(() => expect(onSendCode).toHaveBeenCalledTimes(2));
    await press("Back");
    await heading("Get started");
    expect(screen.getByLabelText("Email").props.value).toBe(" jane@example.com ");
  });

  test("Android's back button leaves the code step first", async () => {
    const listen = jest.spyOn(BackHandler, "addEventListener");
    await renderBlock();
    expect(listen).not.toHaveBeenCalled();
    await toCode();
    const handler = listen.mock.calls.at(-1)![1];
    let handled: boolean | null | undefined;
    await act(async () => {
      handled = handler({} as Parameters<typeof handler>[0]);
    });
    expect(handled).toBe(true);
    await heading("Get started");
    listen.mockRestore();
  });

  test("errors from every callback are shown only as toasts", async () => {
    const onSocialSignIn = jest.fn().mockRejectedValue(new Error("Cancelled"));
    const onSendCode = jest
      .fn()
      .mockRejectedValueOnce(new Error("Rate limited"))
      .mockResolvedValue(undefined);
    const onSubmit = jest.fn().mockRejectedValue(new Error("Wrong code"));
    await renderBlock({ onSocialSignIn, onSendCode, onSubmit });

    await press("Continue with Google");
    await waitFor(() =>
      expect(toasts()).toEqual([
        { variant: "error", title: "Couldn't sign up", description: "Cancelled" },
      ]),
    );
    expect(onSocialSignIn).toHaveBeenCalledWith("google");

    await press("Sign up with email");
    await fireEvent.changeText(screen.getByLabelText("Email"), "jane@example.com");
    await press("Send code");
    await waitFor(() =>
      expect(toasts().at(-1)).toEqual({
        variant: "error",
        title: "Couldn't send the code",
        description: "Rate limited",
      }),
    );
    expect(screen.getByLabelText("Email")).toBeTruthy();

    await press("Send code");
    await heading("Check your inbox");
    await fireEvent.changeText(screen.getByLabelText("Verification code, 6 digits"), "000000");
    await press("Create account");
    await waitFor(() =>
      expect(toasts().at(-1)).toEqual({
        variant: "error",
        title: "Couldn't create your account",
        description: "Wrong code",
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
    await toCode();
    expect(screen.getByRole("button", { name: "Create account" })).toBeTruthy();
  });
});

describe("sign-up-03: screen-reader focus on step change", () => {
  test("moves to the code step's heading, and back to the first heading with Back", async () => {
    await renderBlock();
    await press("Sign up with email");
    expect(focusMoves).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText("Email"), "jane@example.com");
    await press("Send code");
    await expectFocusOn("Check your inbox");
    await press("Back");
    await expectFocusOn("Get started");
  });

  test("moves back to the first heading on Android's back button", async () => {
    const listen = jest.spyOn(BackHandler, "addEventListener");
    await renderBlock();
    await toCode();
    await expectFocusOn("Check your inbox");
    await androidBack(listen);
    await expectFocusOn("Get started");
    listen.mockRestore();
  });

  test("without a screen reader, the new step's field takes the keyboard", async () => {
    await renderBlock();
    await toCode();
    expect(screen.getByLabelText("Verification code, 6 digits").props.autoFocus).toBe(true);
    await press("Back");
    await heading("Get started");
    expect(screen.getByLabelText("Email").props.autoFocus).toBe(true);
  });

  test("with a screen reader on, a step change leaves focus on the heading", async () => {
    screenReader(true);
    await renderBlock();
    // "Sign up with email" is not a step change: the field it reveals still takes focus.
    await press("Sign up with email");
    expect(screen.getByLabelText("Email").props.autoFocus).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Email"), "jane@example.com");
    await press("Send code");
    await heading("Check your inbox");
    expect(screen.getByLabelText("Verification code, 6 digits").props.autoFocus).toBe(false);
    await press("Back");
    await heading("Get started");
    expect(screen.getByLabelText("Email").props.autoFocus).toBe(false);
  });
});
