import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Hexagon } from "lucide-react-native";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { BackHandler, View, type Text as RNText } from "react-native";
import { z } from "zod";

import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { FormField } from "@/registry/components/form-field";
import { Icon } from "@/registry/components/icon";
import { Input } from "@/registry/components/input";
import { InputOTP } from "@/registry/components/input-otp";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { KeyboardStickyFooter } from "@/registry/components/primitives/keyboard";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";
import { createStyles, useTheme } from "@/registry/theme";

import { SocialButtons, type SocialProvider } from "./components/social-buttons";
import { useStepFocus } from "./hooks/use-step-focus";

export type { SocialProvider } from "./components/social-buttons";

// sign-up-03, social first, then a code: brand-led and passwordless. Apple and Google are the
// main path; "Sign up with email" reveals the email field, and "Send code" moves on to a 6-digit
// code (InputOTP). There is no password. The step is kept inside the Block. Edit the copy, the
// logo and the rules below; they are yours.

/** `social`: the buttons (and, once revealed, the email field). `code`: the code check. */
type Step = "social" | "code";

const email = z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email"));
/** Each step checks only its own field; the other passes through. */
const schemas = {
  social: z.object({ email, code: z.string() }),
  code: z.object({ email, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") }),
} satisfies Record<Step, z.ZodType<SignUp03Values>>;

/** The email and the code the user typed. */
export type SignUp03Values = { email: string; code: string };

export type SignUp03Props = {
  /** Run the provider's sign-up. Throw to show the error as a toast. */
  onSocialSignIn?: (provider: SocialProvider) => void | Promise<void>;
  /**
   * Email a 6-digit sign-up code (on "Send code" and on "Resend"). Throw to show the error as a
   * toast and stay on the email field.
   */
  onSendCode?: (email: string) => void | Promise<void>;
  /**
   * Check the code and create the account. Throw to show the error as a toast; resolve and an
   * "Account created" toast appears (navigate away here). Store any session in
   * expo-secure-store.
   */
  onSubmit?: (values: SignUp03Values) => void | Promise<void>;
};

export function SignUp03({ onSocialSignIn, onSendCode, onSubmit }: SignUp03Props) {
  const [step, setStep] = useState<Step>("social");
  const [emailOpen, setEmailOpen] = useState(false);
  const [sending, setSending] = useState(false);
  // Each step change moves the screen reader to the new heading (or, without one, the keyboard to
  // the new field).
  const { headingRef, autoFocus } = useStepFocus(step);
  const form = useForm<SignUp03Values>({
    resolver: zodResolver(schemas[step]),
    defaultValues: { email: "", code: "" },
  });
  const { handleSubmit, getValues, clearErrors } = form;

  const goTo = (next: Step) => {
    clearErrors();
    setStep(next);
  };

  // On the code step, Android's back button returns to the email field before it leaves.
  useEffect(() => {
    if (step !== "code") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      clearErrors();
      setStep("social");
      return true;
    });
    return () => subscription.remove();
  }, [step, clearErrors]);

  /** Emails the code; says so in a toast. Returns whether it worked. */
  const sendCode = async (address: string) => {
    setSending(true);
    try {
      await onSendCode?.(address);
      toast.success("Code sent", { description: `Check ${address}` });
      return true;
    } catch (error) {
      toast.error("Couldn't send the code", { description: messageOf(error) });
      return false;
    } finally {
      setSending(false);
    }
  };

  const next = handleSubmit(async (values) => {
    if (step === "social") {
      if (await sendCode(values.email)) goTo("code");
      return;
    }
    try {
      await onSubmit?.(values);
      toast.success("Account created");
    } catch (error) {
      toast.error("Couldn't create your account", { description: messageOf(error) });
    }
  });

  const socialSignIn = async (provider: SocialProvider) => {
    try {
      await onSocialSignIn?.(provider);
    } catch (error) {
      toast.error("Couldn't sign up", { description: messageOf(error) });
    }
  };

  return step === "social" ? (
    <SocialStep
      form={form}
      headingRef={headingRef}
      autoFocus={autoFocus}
      emailOpen={emailOpen}
      onOpenEmail={() => setEmailOpen(true)}
      onSocialSignIn={socialSignIn}
      onNext={next}
    />
  ) : (
    <CodeStep
      form={form}
      headingRef={headingRef}
      autoFocus={autoFocus}
      email={getValues("email").trim()}
      sending={sending}
      onBack={() => goTo("social")}
      onResend={() => void sendCode(getValues("email").trim())}
      onNext={next}
    />
  );
}

type StepProps = {
  form: UseFormReturn<SignUp03Values>;
  /** On the step's heading, so a step change can move the screen reader to it. */
  headingRef: RefObject<RNText | null>;
  /** Whether the step's field takes the keyboard when it appears (off while a screen reader runs). */
  autoFocus: boolean;
  onNext: () => void;
};

/** The brand, Apple and Google, and the email field behind "Sign up with email". */
function SocialStep({
  form: {
    control,
    formState: { isSubmitting },
  },
  headingRef,
  autoFocus,
  emailOpen,
  onOpenEmail,
  onSocialSignIn,
  onNext,
}: StepProps & {
  emailOpen: boolean;
  onOpenEmail: () => void;
  onSocialSignIn: (provider: SocialProvider) => void;
}) {
  const styles = useStyles();
  // Opened here by "Sign up with email": the field takes focus. Already open when this step
  // appears (Back from the code): the heading gets the screen reader, so only take the keyboard
  // without one.
  const openedOnArrival = useRef(emailOpen).current;
  return (
    <Container contentContainerStyle={styles.socialContent}>
      <View style={styles.brand}>
        {/* Your logo goes here. */}
        <View style={styles.logo}>
          <Icon icon={Hexagon} size="lg" color="primaryForeground" />
        </View>
        <Text variant="h1" align="center" ref={headingRef}>
          Get started
        </Text>
        <Text variant="body" color="mutedForeground" align="center">
          Create your account in seconds.
        </Text>
      </View>

      <SocialButtons size="lg" onPress={onSocialSignIn} disabled={isSubmitting} />

      {emailOpen ? (
        <>
          <FocusChain onSubmit={onNext}>
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <FormField label="Email" error={fieldState.error?.message}>
                  <Input
                    ref={field.ref}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoFocus={autoFocus || !openedOnArrival}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </FormField>
              )}
            />
          </FocusChain>
          <Button size="lg" label="Send code" loading={isSubmitting} onPress={onNext} />
        </>
      ) : (
        <Button variant="ghost" size="lg" label="Sign up with email" onPress={onOpenEmail} />
      )}

      <Text variant="caption" color="mutedForeground" align="center">
        By continuing you agree to the Terms and Privacy Policy.
      </Text>
    </Container>
  );
}

/** The 6-digit code check, with Back and Resend. */
function CodeStep({
  form: {
    control,
    formState: { isSubmitting },
  },
  headingRef,
  autoFocus,
  email,
  sending,
  onBack,
  onResend,
  onNext,
}: StepProps & { email: string; sending: boolean; onBack: () => void; onResend: () => void }) {
  const styles = useStyles();
  const { controlHeight, spacing } = useTheme();
  return (
    <View style={styles.root}>
      <Container
        edges={["top"]}
        // Keep the code clear of the footer that rides above the keyboard.
        extraKeyboardSpace={controlHeight.lg + spacing[3] * 2}
        contentContainerStyle={styles.codeContent}
      >
        <Button
          variant="ghost"
          icon={ChevronLeft}
          aria-label="Back"
          onPress={onBack}
          style={styles.back}
        />

        <View style={styles.heading}>
          <Text variant="h1" ref={headingRef}>
            Check your inbox
          </Text>
          <Text variant="body" color="mutedForeground">
            {`Enter the 6-digit code sent to ${email}`}
          </Text>
        </View>

        <FocusChain onSubmit={onNext}>
          <Controller
            control={control}
            name="code"
            render={({ field, fieldState }) => (
              <FormField error={fieldState.error?.message}>
                <InputOTP
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  aria-label="Verification code"
                  autoFocus={autoFocus}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                />
              </FormField>
            )}
          />
        </FocusChain>

        <View style={styles.resend}>
          <Text variant="small" color="mutedForeground">
            Didn&apos;t get it?
          </Text>
          <Button
            variant="link"
            size="sm"
            label="Resend"
            loading={sending}
            disabled={isSubmitting}
            onPress={onResend}
            style={styles.inline}
          />
        </View>
      </Container>

      <KeyboardStickyFooter style={styles.footer}>
        <Button
          size="lg"
          label="Create account"
          loading={isSubmitting}
          disabled={sending}
          onPress={onNext}
        />
      </KeyboardStickyFooter>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  socialContent: {
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[6],
    paddingTop: t.spacing[10],
    paddingBottom: t.spacing[8],
  },
  // The brand fills the space above the buttons, centred.
  brand: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[3],
    paddingBottom: t.spacing[6],
  },
  logo: {
    width: t.scaleValue(72),
    height: t.scaleValue(72),
    marginBottom: t.spacing[2],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radius["2xl"],
    borderCurve: "continuous",
    backgroundColor: t.colors.primary,
  },
  codeContent: { paddingHorizontal: t.spacing[6], paddingTop: t.spacing[4] },
  // The chevron lines up with the content's edge; the tap area stays 48.
  back: { alignSelf: "flex-start", marginStart: -t.spacing[3] },
  heading: { gap: t.spacing[2], marginTop: t.spacing[4], marginBottom: t.spacing[4] },
  resend: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[1],
  },
  inline: { paddingHorizontal: 0 },
  footer: { paddingHorizontal: t.spacing[6], backgroundColor: t.colors.background },
}));

/** The message to show for an error thrown by your callbacks. */
function messageOf(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Try again.";
}
