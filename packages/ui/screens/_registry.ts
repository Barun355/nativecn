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
    /** Accessibility facts, one short sentence each (#138). */
    a11y: string[];
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
const SIGN_UP_KEYWORDS = [
  "sign up",
  "signup",
  "register",
  "registration",
  "create account",
  "auth",
  "authentication",
  "form",
];

const FEEDBACK =
  "Validation errors appear under each field. Errors thrown by your callbacks, and the success message, appear only as toast()s: render <Toaster /> in the root Layout (init and create already do).";
/** Accessibility facts shared by every form Block. */
const FORM_A11Y = [
  "Each field is in a FormField: its label is the field's accessible name, and a validation error becomes its hint and is announced once.",
  "Errors from your callbacks and the success message are toast()s, which screen readers announce.",
  "The submit Button is announced busy while your callback runs.",
];
const SOCIAL_A11Y =
  'Apple and Google are labelled Buttons ("Continue with Apple", "Continue with Google"); their logos are decorative.';
const BACK_A11Y =
  'Back is an icon-only Button named "Back"; Android\'s back button steps back too.';
const CODE_A11Y = 'The code is one InputOTP field, read as "Verification code, 6 digits".';
/** Multi-step Blocks: where focus goes when the step changes (#145). */
const STEP_FOCUS_A11Y =
  "While a screen reader runs, the new step's field doesn't take the keyboard, so focus stays on the heading; without one, the field takes the keyboard as before.";
const STEP_FOCUS_DOCS =
  "hooks/use-step-focus.ts moves screen-reader focus to the new step's heading on every step change; it is this Block's own copy.";
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
      a11y: [
        '"Welcome back" has role heading; the logo icon and the lines around "or" are decorative.',
        ...FORM_A11Y,
        SOCIAL_A11Y,
      ],
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
      a11y: [
        'The headline has role heading; the logo icon and the lines around "or" are decorative.',
        ...FORM_A11Y,
        SOCIAL_A11Y,
      ],
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
    files: ["index.tsx", "hooks/use-step-focus.ts"],
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
      docs: `Render it from a route: \`export default function Screen() { return <SignIn03 onSubmit={signIn} onSendCode={sendCode} />; }\`. The step (email, password, code) lives inside the Block; Back (an icon-only Button with a Lucide chevron-left) and Android's back button step back, keeping what was typed. Each step validates only its own field with zod through react-hook-form; the main button sits in a KeyboardStickyFooter above the keyboard. ${STEP_FOCUS_DOCS} ${FEEDBACK} ${BACKEND}`,
      a11y: [
        "Each step's title has role heading.",
        "Every step change (Continue, Email me a code instead, Back, Android's back button) moves screen-reader focus to the new step's title.",
        STEP_FOCUS_A11Y,
        ...FORM_A11Y,
        BACK_A11Y,
        CODE_A11Y,
      ],
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
  screenBlock({
    name: "sign-up-01",
    title: "Classic single form",
    description:
      'A classic sign-up Screen on one scroll: Apple and Google on top, "or", then name, email and password, a terms Checkbox with Terms and Privacy Policy links, Create account, and a Sign in link.',
    categories: ["auth"],
    dependencies: [...FORMS, ...LUCIDE],
    registryDependencies: [...FORM_ITEMS, "checkbox", "icon", "separator", "toast"],
    files: ["index.tsx", "components/social-buttons.tsx"],
    meta: {
      route: "(auth)/sign-up",
      component: "SignUp01",
      difference: "Social on top, then name, email, password and a terms Checkbox; one form.",
      props: {
        onSubmit:
          '(values: { name, email, password }) => void | Promise<void>: create the account; throw to show the error as a toast, resolve for an "Account created" toast',
        onSocialSignIn:
          '(provider: "apple" | "google") => void | Promise<void>: run that provider\'s sign-up; a thrown error becomes a toast',
        onTermsPress: "() => void: the Terms link under the checkbox",
        onPrivacyPress: "() => void: the Privacy Policy link under the checkbox",
        onSignIn: "() => void: the Sign in link",
      },
      docs: `Render it from a route: \`export default function Screen() { return <SignUp01 onSubmit={signUp} />; }\`. The name, email and password (at least 8 characters) are validated with zod through react-hook-form (name and email trimmed), and the terms Checkbox must be ticked; its error appears under it. The three fields are in a FocusChain (Next, Next, then Done submits). ${FEEDBACK} The Apple and Google logos are bundled SVGs in components/social-buttons.tsx; the buttons only call onSocialSignIn. ${BACKEND}`,
      a11y: [
        '"Create an account" has role heading; the lines around "or" are decorative.',
        ...FORM_A11Y,
        'The password field\'s hint is "At least 8 characters." until it has an error.',
        'The terms Checkbox is named "I agree to the Terms and Privacy Policy"; its error is its hint and is announced. The dot between the Terms and Privacy Policy links is hidden.',
        SOCIAL_A11Y,
      ],
      keywords: [...SIGN_UP_KEYWORDS, "social login", "apple", "google", "terms", "classic"],
    },
  }),
  screenBlock({
    name: "sign-up-02",
    title: "Step-by-step wizard",
    description:
      "A sign-up wizard, one question per step under a Progress bar: email, name, password, then a 6-digit code (InputOTP). Lucide chevron-left Back buttons; the Continue button rides above the keyboard.",
    categories: ["auth"],
    dependencies: [...FORMS, ...LUCIDE],
    registryDependencies: [...FORM_ITEMS, "progress", "input-otp", "keyboard", "toast"],
    files: ["index.tsx", "hooks/use-step-focus.ts"],
    meta: {
      route: "(auth)/sign-up",
      component: "SignUp02",
      difference:
        "Progress bar plus one question per screen: email → name → password → verify code.",
      props: {
        onSendCode:
          "(details: { email, name, password }) => void | Promise<void>: register the details and email a 6-digit code (after the password step, and on Resend, so make it safe to repeat); a thrown error becomes a toast and the step stays",
        onSubmit:
          '(values: { email, name, password, code }) => void | Promise<void>: check the code and finish the account; throw to show the error as a toast, resolve for an "Account created" toast',
      },
      docs: `Render it from a route: \`export default function Screen() { return <SignUp02 onSendCode={register} onSubmit={verify} />; }\`. The step (email, name, password, code) lives inside the Block, and the Progress bar shows how far along it is. Back (an icon-only Button with a Lucide chevron-left) and Android's back button step back, keeping every answer. Each step validates its own field with zod through react-hook-form; the password needs at least 8 characters. The main button sits in a KeyboardStickyFooter above the keyboard. ${STEP_FOCUS_DOCS} ${FEEDBACK} ${BACKEND}`,
      a11y: [
        "Each step's title has role heading.",
        "Every step change (Continue, Back, Android's back button) moves screen-reader focus to the new step's title.",
        STEP_FOCUS_A11Y,
        'The Progress bar is named "Step 2 of 4" and carries its value; the visible "2/4" is hidden from screen readers.',
        ...FORM_A11Y,
        BACK_A11Y,
        CODE_A11Y,
      ],
      keywords: [
        ...SIGN_UP_KEYWORDS,
        "wizard",
        "step by step",
        "multi step",
        "onboarding",
        "progress",
        "verify email",
        "otp",
      ],
    },
  }),
  screenBlock({
    name: "sign-up-03",
    title: "Social-first + verify",
    description:
      'A brand-led, passwordless sign-up Screen: the logo and headline centred above Apple and Google; "Sign up with email" reveals the email field, and Send code moves on to a 6-digit code (InputOTP).',
    categories: ["auth"],
    dependencies: [...FORMS, ...LUCIDE],
    registryDependencies: [...FORM_ITEMS, "icon", "input-otp", "keyboard", "toast"],
    files: ["index.tsx", "components/social-buttons.tsx", "hooks/use-step-focus.ts"],
    meta: {
      route: "(auth)/sign-up",
      component: "SignUp03",
      difference:
        "Brand-led and passwordless; Apple/Google lead, and the email path sends an InputOTP code.",
      props: {
        onSocialSignIn:
          '(provider: "apple" | "google") => void | Promise<void>: run that provider\'s sign-up; a thrown error becomes a toast',
        onSendCode:
          "(email: string) => void | Promise<void>: email a 6-digit code (Send code, Resend); a thrown error becomes a toast and the email field stays",
        onSubmit:
          '(values: { email, code }) => void | Promise<void>: check the code and create the account; throw to show the error as a toast, resolve for an "Account created" toast',
      },
      docs: `Render it from a route: \`export default function Screen() { return <SignUp03 onSocialSignIn={signUpWith} onSendCode={sendCode} onSubmit={verify} />; }\`. There is no password: the email path checks the address with zod through react-hook-form, calls onSendCode, then asks for the 6-digit code. The step lives inside the Block; Back (an icon-only Button with a Lucide chevron-left) and Android's back button return to the email field, keeping it. The Create account button sits in a KeyboardStickyFooter above the keyboard. ${STEP_FOCUS_DOCS} ${FEEDBACK} The Apple and Google logos are bundled SVGs in components/social-buttons.tsx; the buttons only call onSocialSignIn. ${BACKEND}`,
      a11y: [
        'The headline and "Check your inbox" have role heading; the logo icon is decorative.',
        'Moving to the code step puts screen-reader focus on "Check your inbox"; Back and Android\'s back button put it on the headline.',
        STEP_FOCUS_A11Y,
        ...FORM_A11Y,
        SOCIAL_A11Y,
        BACK_A11Y,
        CODE_A11Y,
      ],
      keywords: [
        ...SIGN_UP_KEYWORDS,
        "social login",
        "apple",
        "google",
        "passwordless",
        "magic code",
        "verify email",
        "otp",
      ],
    },
  }),
] satisfies RegistryItem[];
