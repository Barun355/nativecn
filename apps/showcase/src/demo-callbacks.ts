// Demo handlers for the callbacks a Block takes (its `on…` props): Blocks never talk to a server,
// so the Showcase fakes one. No React Native imports, so the node tests run it directly.

/** How long the fake server takes, so loading states show. */
export const FAKE_LATENCY = 800;

/**
 * - `server`: a fake request the Block awaits (submit, send a code); it gives its own feedback.
 * - `social`: a fake provider sign-in; the Showcase shows a Toast, since the Block shows none.
 * - `press`: a link or button the Block hands to the app; the Showcase shows a Toast.
 */
export type CallbackKind = "server" | "social" | "press";

export function callbackKind(name: string): CallbackKind {
  if (name === "onSubmit" || name === "onSendCode") return "server";
  if (name === "onSocialSignIn") return "social";
  return "press";
}

/** `onForgotPassword` → "Forgot password", `onTermsPress` → "Terms". */
export function callbackLabel(name: string): string {
  const words = name
    .replace(/^on/, "")
    .replace(/Press$/, "")
    .split(/(?=[A-Z])/)
    .map((w) => w.toLowerCase());
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The fake server fails for any value containing "error", or the code 000000, to show errors. */
export function failsOnPurpose(args: unknown[]): boolean {
  const text = JSON.stringify(args);
  return text.includes("error") || text.includes("000000");
}
