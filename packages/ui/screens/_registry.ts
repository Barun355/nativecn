import type { RegistryItem } from "shadcn/schema";

// Screen Blocks: a whole Screen in its own folder, installed to {screens}/<block>/ (or
// src/features/<feature>/screens/<block>/ in feature mode). `add --route` writes a route file in
// {app} that renders `meta.component`; `meta.route` is the suggested route.
const screenBlock = ({
  name,
  files,
  ...item
}: Pick<
  RegistryItem,
  "name" | "title" | "description" | "categories" | "dependencies" | "registryDependencies"
> & {
  /** Paths inside the Block's folder, e.g. `index.tsx`, `components/social-buttons.tsx`. */
  files: string[];
  meta: {
    route: string;
    component: string;
    difference: string;
    props: Record<string, string>;
    docs: string;
    keywords: string[];
  };
}): RegistryItem => ({
  name,
  type: "registry:block",
  ...item,
  meta: { kind: "Block", ...item.meta },
  files: files.map((file) => ({
    path: `screens/${name}/${file}`,
    type: "registry:file",
    target: `{screens}/${name}/${file}`,
  })),
});

/** The recorded ADR 0007 exceptions for form Blocks (Design System ADR 0002), pinned. */
const FORMS = ["react-hook-form@^7.89.0", "zod@^4.6.5"];
/** lucide-react-native is the recorded ADR 0007 exception (Lucide decision); react-native-svg is SDK-pinned. */
const LUCIDE = ["lucide-react-native@^1.51.0", "react-native-svg"];

const FORM_ITEMS = ["theme", "container", "text", "button", "form-field", "input", "focus-chain"];

const SIGN_IN_KEYWORDS = ["sign in", "login", "log in", "auth", "authentication", "form"];

const FEEDBACK =
  "Validation errors appear under each field. Errors thrown by your callbacks, and the success message, appear only as toast()s: render <Toaster /> in the root Layout (init and create already do).";
const BACKEND =
  "The Block never talks to a server: wire your auth backend in the route file through the props, and keep any session or token in expo-secure-store, never AsyncStorage.";

export default [
  screenBlock({
    name: "sign-in-01",
    title: "Classic centred",
    description:
      'A centred sign-in Screen: logo, email and password, Forgot password, an "or" divider, then Apple and Google, and a Sign up link.',
    categories: ["auth"],
    dependencies: [...FORMS, ...LUCIDE],
    registryDependencies: [...FORM_ITEMS, "icon", "separator", "toast"],
    files: ["index.tsx", "components/social-buttons.tsx"],
    meta: {
      route: "(auth)/sign-in",
      component: "SignIn01",
      difference: 'Logo, email and password, "or", then social; everything on one screen.',
      props: {
        onSubmit:
          '(values: { email, password }) => void | Promise<void>: sign in; throw to show the error as a toast, resolve for a "Signed in" toast',
        onSocialSignIn:
          '(provider: "apple" | "google") => void | Promise<void>: run that provider\'s sign-in; a thrown error becomes a toast',
        onForgotPassword: "() => void: the Forgot password? link",
        onSignUp: "() => void: the Sign up link",
      },
      docs: `Render it from a route: \`export default function Screen() { return <SignIn01 onSubmit={signIn} />; }\`. The email and password are validated with zod through react-hook-form (the email is trimmed), and the fields are in a FocusChain (Next, then Done submits). ${FEEDBACK} The Apple and Google logos are bundled SVGs in components/social-buttons.tsx; the buttons only call onSocialSignIn. ${BACKEND}`,
      keywords: [...SIGN_IN_KEYWORDS, "social login", "apple", "google", "classic"],
    },
  }),
  screenBlock({
    name: "sign-in-02",
    title: "Social-first hero",
    description:
      'A social-first sign-in Screen: a dark brand hero (logo, headline, subtitle, centred) above a panel where Apple and Google lead and "Continue with email" reveals the email form.',
    categories: ["auth"],
    dependencies: [...FORMS, ...LUCIDE, "react-native-safe-area-context"],
    registryDependencies: [...FORM_ITEMS, "icon", "separator", "toast"],
    files: ["index.tsx", "components/social-buttons.tsx"],
    meta: {
      route: "(auth)/sign-in",
      component: "SignIn02",
      difference:
        'Dark brand hero, centred; Apple/Google are the primary path; "Continue with email" reveals the fields.',
      props: {
        onSubmit:
          '(values: { email, password }) => void | Promise<void>: sign in; throw to show the error as a toast, resolve for a "Signed in" toast',
        onSocialSignIn:
          '(provider: "apple" | "google") => void | Promise<void>: run that provider\'s sign-in; a thrown error becomes a toast',
      },
      docs: `Render it from a route: \`export default function Screen() { return <SignIn02 onSocialSignIn={signInWith} onSubmit={signIn} />; }\`. The hero is drawn with the dark Scheme's Colour Roles in both Schemes (a nested ThemeProvider scheme="dark") and runs under a light status bar. The email form appears only after "Continue with email"; it is validated with zod through react-hook-form, in a FocusChain. ${FEEDBACK} ${BACKEND}`,
      keywords: [...SIGN_IN_KEYWORDS, "social login", "apple", "google", "hero", "welcome"],
    },
  }),
  screenBlock({
    name: "sign-in-03",
    title: "Email-first, two steps",
    description:
      'An email-first sign-in Screen in two steps: the email, then the password, with "Email me a code instead" switching to a 6-digit code (InputOTP). Lucide chevron-left Back buttons.',
    categories: ["auth"],
    dependencies: [...FORMS, ...LUCIDE],
    registryDependencies: [...FORM_ITEMS, "input-otp", "keyboard", "toast"],
    files: ["index.tsx"],
    meta: {
      route: "(auth)/sign-in",
      component: "SignIn03",
      difference:
        'Email → password, one question per step, with "Email me a code instead" (InputOTP).',
      props: {
        onSubmit:
          '(values: { method: "password", email, password } | { method: "code", email, code }) => void | Promise<void>: sign in; throw to show the error as a toast, resolve for a "Signed in" toast',
        onSendCode:
          "(email: string) => void | Promise<void>: email a 6-digit code (Email me a code instead, Resend); a thrown error becomes a toast and the step stays",
      },
      docs: `Render it from a route: \`export default function Screen() { return <SignIn03 onSubmit={signIn} onSendCode={sendCode} />; }\`. The step (email, password, code) lives inside the Block; Back (an icon-only Button with a Lucide chevron-left, aria-label "Back") and Android's back button step back, keeping what was typed. Each step validates only its own field with zod through react-hook-form; the main button sits in a KeyboardStickyFooter above the keyboard. ${FEEDBACK} ${BACKEND}`,
      keywords: [
        ...SIGN_IN_KEYWORDS,
        "email first",
        "two step",
        "multi step",
        "passwordless",
        "magic code",
        "otp",
      ],
    },
  }),
] satisfies RegistryItem[];
