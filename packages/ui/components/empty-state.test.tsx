import { render, screen } from "@testing-library/react-native";
import { Inbox } from "lucide-react-native";
import { Dimensions, StyleSheet, View } from "react-native";

import { Button } from "@/registry/components/button";
import { EmptyState, type EmptyStateProps } from "@/registry/components/empty-state";
import { setActiveStyle } from "@/registry/styles";
import {
  ThemeProvider,
  colors,
  computeScale,
  scaleTokens,
  scaleValue,
  useSchemeStore,
} from "@/registry/theme";

const { width, height } = Dimensions.get("window");
const scale = computeScale(width, height);
const t = scaleTokens(scale);
const s = (v: number) => scaleValue(v, scale);

async function renderEmpty(props: Partial<EmptyStateProps> = {}) {
  await render(
    <ThemeProvider scheme="light">
      <EmptyState
        testID="empty"
        icon={Inbox}
        title="No messages yet"
        description="New messages will appear here."
        {...props}
      />
    </ThemeProvider>,
  );
  return screen.getByTestId("empty");
}

const flat = (el: { props: Record<string, unknown> }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
type Host = { props: Record<string, unknown>; children: unknown[] };

beforeEach(() => useSchemeStore.setState({ scheme: "system", hydrated: true }));
afterEach(() => setActiveStyle("vega"));

describe("EmptyState", () => {
  test("the title is a heading; the description is muted", async () => {
    await renderEmpty();
    expect(screen.getByRole("heading", { name: "No messages yet" })).toBeTruthy();
    expect(screen.getByText("New messages will appear here.")).toHaveStyle({
      color: colors.light.mutedForeground,
      textAlign: "center",
    });
  });

  test("root and icon use the empty-state Slots in each Style", async () => {
    let el = await renderEmpty();
    expect(flat(el)).toMatchObject({ padding: t.spacing[8], gap: t.spacing[3] });
    expect(flat(el.children[0] as Host)).toMatchObject({
      width: s(48),
      height: s(48),
      borderRadius: t.radius.full,
      backgroundColor: colors.light.muted,
    });
    setActiveStyle("nova");
    el = await renderEmpty();
    expect(flat(el)).toMatchObject({ padding: t.spacing[6], gap: t.spacing[2] });
    expect(flat(el.children[0] as Host)).toMatchObject({ width: s(36), height: s(36) });
  });

  test("the icon is decorative and optional", async () => {
    const el = await renderEmpty();
    expect(screen.queryByRole("img")).toBeNull();
    expect(el.children).toHaveLength(2);
    expect((await renderEmpty({ icon: undefined, description: undefined })).children).toHaveLength(
      1,
    );
  });

  test("children are the action", async () => {
    await renderEmpty({ children: <Button label="Compose" /> });
    expect(screen.getByRole("button", { name: "Compose" })).toBeTruthy();
  });

  test("style is merged last; ref and props pass through", async () => {
    const ref = { current: null as View | null };
    await renderEmpty({ ref, style: { flex: 1 }, accessibilityHint: "Nothing here" });
    const el = screen.getByTestId("empty");
    expect(ref.current).not.toBeNull();
    expect(flat(el).flex).toBe(1);
    expect(el.props.accessibilityHint).toBe("Nothing here");
  });
});
