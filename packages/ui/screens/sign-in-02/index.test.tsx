import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { useToastStore } from "@/registry/components/toast";
import { setActiveStyle } from "@/registry/styles";
import { ThemeProvider, colors, useSchemeStore, type Scheme } from "@/registry/theme";
import { announce } from "@/registry/utils/announce";

import { SignIn02, type SignIn02Props } from ".";

jest.mock("@/registry/utils/announce", () => ({ announce: jest.fn() }));

const hidden = { includeHiddenElements: true } as const;

async function renderBlock(props: SignIn02Props = {}, scheme: Scheme = "light") {
  await render(
    <ThemeProvider scheme={scheme}>
      <SignIn02 {...props} />
    </ThemeProvider>,
  );
}

const toasts = () =>
  useToastStore.getState().toasts.map(({ variant, title, description }) => ({
    variant,
    title,
    ...(description ? { description } : {}),
  }));

async function openEmail() {
  await fireEvent.press(screen.getByRole("button", { name: "Continue with email" }));
}

beforeEach(() => {
  useSchemeStore.setState({ scheme: "system", hydrated: true });
  useToastStore.setState({ toasts: [] });
  jest.mocked(announce).mockClear();
});

afterEach(() => setActiveStyle("vega"));

describe("sign-in-02", () => {
  test.each(["light", "dark"] as const)("the hero is dark in the %s Scheme", async (scheme) => {
    await renderBlock({}, scheme);
    const headline = screen.getByRole("heading", { name: "Your app,\neverywhere." });
    expect(headline).toHaveStyle({ color: colors.dark.foreground });
    expect(headline.parent).toHaveStyle({ backgroundColor: colors.dark.background });
  });

  test("Apple and Google come first; the email form is hidden until asked for", async () => {
    await renderBlock();
    expect(screen.getByRole("button", { name: "Continue with Apple" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy();
    expect(screen.queryByLabelText("Email")).toBeNull();
    await openEmail();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Continue with email" })).toBeNull();
  });

  test("social buttons only call onSocialSignIn", async () => {
    const onSocialSignIn = jest.fn();
    await renderBlock({ onSocialSignIn });
    await fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
    expect(onSocialSignIn).toHaveBeenCalledWith("google");
    expect(toasts()).toEqual([]);
  });

  test("field errors appear under the fields", async () => {
    const onSubmit = jest.fn();
    await renderBlock({ onSubmit });
    await openEmail();
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email", hidden)).toBeTruthy();
    expect(screen.getByText("Password is required", hidden)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("valid values go to onSubmit, then a success toast; errors become an error toast", async () => {
    const onSubmit = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Too many attempts"));
    await renderBlock({ onSubmit });
    await openEmail();
    await fireEvent.changeText(screen.getByLabelText("Email"), "jane@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    await fireEvent(screen.getByLabelText("Password"), "submitEditing");
    await waitFor(() => expect(toasts()).toEqual([{ variant: "success", title: "Signed in" }]));
    expect(onSubmit).toHaveBeenCalledWith({ email: "jane@example.com", password: "secret" });

    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(toasts()[1]).toEqual({
        variant: "error",
        title: "Couldn't sign in",
        description: "Too many attempts",
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
    await openEmail();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });
});
