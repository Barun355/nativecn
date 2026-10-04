import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { BackHandler } from "react-native";

import { useToastStore } from "@/registry/components/toast";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, useSchemeStore, type Scheme } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

import { SignUp02, type SignUp02Props } from ".";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

const hidden = { includeHiddenElements: true } as const;

async function renderBlock(props: SignUp02Props = {}, scheme: Scheme = "light") {
  await render(
    <ThemeProvider scheme={scheme}>
      <SignUp02 {...props} />
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
const progress = () => screen.getByRole("progressbar");

/** Answers a step's field and presses Continue. */
async function answer(label: string, value: string, nextHeading: string) {
  await fireEvent.changeText(screen.getByLabelText(label), value);
  await press("Continue");
  await heading(nextHeading);
}

async function toPassword() {
  await answer("Email", " jane@example.com ", "What should we call you?");
  await answer("Full name", " Jane Doe ", "Create a password");
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  useToastStore.setState({ toasts: [] });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("sign-up-02", () => {
  test("starts on the email step at 1 of 4, without a Back button", async () => {
    await renderBlock();
    expect(screen.getByRole("heading", { name: "What's your email?" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(progress().props["aria-valuenow"]).toBe(25);
    expect(progress().props["aria-label"]).toBe("Step 1 of 4");
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  test("each step validates only its own field before moving on", async () => {
    await renderBlock();
    await press("Continue");
    expect(await screen.findByText("Enter your email", hidden)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Email"), "jane@");
    await press("Continue");
    expect(await screen.findByText("Enter a valid email", hidden)).toBeTruthy();

    await answer("Email", "jane@example.com", "What should we call you?");
    expect(progress().props["aria-valuenow"]).toBe(50);
    await press("Continue");
    expect(await screen.findByText("Enter your name", hidden)).toBeTruthy();

    await answer("Full name", "Jane", "Create a password");
    expect(progress().props["aria-valuenow"]).toBe(75);
    await fireEvent.changeText(screen.getByLabelText("Password"), "short");
    await press("Continue");
    expect(await screen.findByText("Use at least 8 characters", hidden)).toBeTruthy();
  });

  test("the password step sends the code with the trimmed details, then shows the code step", async () => {
    const onSendCode = jest.fn();
    await renderBlock({ onSendCode });
    await toPassword();
    await fireEvent.changeText(screen.getByLabelText("Password"), "correct horse");
    await fireEvent(screen.getByLabelText("Password"), "submitEditing");
    await heading("Verify your email");
    expect(onSendCode).toHaveBeenCalledWith({
      email: "jane@example.com",
      name: "Jane Doe",
      password: "correct horse",
    });
    expect(toasts()).toEqual([
      { variant: "success", title: "Code sent", description: "Check jane@example.com" },
    ]);
    expect(progress().props["aria-valuenow"]).toBe(100);
    expect(screen.getByText("Enter the 6-digit code sent to jane@example.com")).toBeTruthy();
  });

  test("the code step checks the code, then onSubmit gets everything and a success toast shows", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await toPassword();
    await answer("Password", "correct horse", "Verify your email");

    await press("Create account");
    expect(await screen.findByText("Enter the 6-digit code", hidden)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Verification code, 6 digits"), "123456");
    await press("Create account");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: "jane@example.com",
        name: "Jane Doe",
        password: "correct horse",
        code: "123456",
      }),
    );
    expect(toasts().at(-1)).toEqual({ variant: "success", title: "Account created" });
  });

  test("Back steps back one question at a time, keeping the answers", async () => {
    await renderBlock();
    await toPassword();
    await press("Back");
    await heading("What should we call you?");
    expect(screen.getByLabelText("Full name").props.value).toBe(" Jane Doe ");
    await press("Back");
    await heading("What's your email?");
    expect(screen.getByLabelText("Email").props.value).toBe(" jane@example.com ");
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  test("Android's back button steps back through the wizard first", async () => {
    const listen = jest.spyOn(BackHandler, "addEventListener");
    await renderBlock();
    expect(listen).not.toHaveBeenCalled();
    await answer("Email", "jane@example.com", "What should we call you?");
    const handler = listen.mock.calls.at(-1)![1];
    let handled: boolean | null | undefined;
    await act(async () => {
      handled = handler({} as Parameters<typeof handler>[0]);
    });
    expect(handled).toBe(true);
    await heading("What's your email?");
    listen.mockRestore();
  });

  test("Resend sends the code again", async () => {
    const onSendCode = jest.fn();
    await renderBlock({ onSendCode });
    await toPassword();
    await answer("Password", "correct horse", "Verify your email");
    await press("Resend");
    await waitFor(() => expect(onSendCode).toHaveBeenCalledTimes(2));
    expect(onSendCode).toHaveBeenLastCalledWith({
      email: "jane@example.com",
      name: "Jane Doe",
      password: "correct horse",
    });
  });

  test("errors from onSendCode and onSubmit are shown only as toasts", async () => {
    const onSendCode = jest
      .fn()
      .mockRejectedValueOnce(new Error("Email already in use"))
      .mockResolvedValue(undefined);
    const onSubmit = jest.fn().mockRejectedValue(new Error("Wrong code"));
    await renderBlock({ onSendCode, onSubmit });
    await toPassword();
    await fireEvent.changeText(screen.getByLabelText("Password"), "correct horse");
    await press("Continue");
    await waitFor(() =>
      expect(toasts()).toEqual([
        { variant: "error", title: "Couldn't send the code", description: "Email already in use" },
      ]),
    );
    expect(screen.getByRole("heading", { name: "Create a password" })).toBeTruthy();

    await press("Continue");
    await heading("Verify your email");
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
    await toPassword();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
  });
});
