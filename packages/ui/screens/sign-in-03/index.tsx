import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BackHandler, View } from "react-native";
import { z } from "zod";

import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { FormField } from "@/registry/components/form-field";
import { Input } from "@/registry/components/input";
import { InputOTP } from "@/registry/components/input-otp";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { KeyboardStickyFooter } from "@/registry/components/primitives/keyboard";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";
import { createStyles, useTheme } from "@/registry/theme";

import { useStepFocus } from "./hooks/use-step-focus";

// sign-in-03, email first, in two steps: the email, then the password, with "Email me a code
// instead" switching to a 6-digit code. The step is kept inside the Block. Edit the copy and the
// rules below; they are yours.

/** The steps, in order. Back goes to the previous one. */
type Step = "email" | "password" | "code";
const previous: Record<Step, Step | undefined> = {
  email: undefined,
  password: "email",
  code: "password",
};

const email = z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email"));
/** Each step checks only its own field; the others pass through. */
const schemas = {
  email: z.object({ email, password: z.string(), code: z.string() }),
  password: z.object({
    email,
    password: z.string().min(1, "Password is required"),
    code: z.string(),
  }),
  code: z.object({
    email,
    password: z.string(),
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  }),
} satisfies Record<Step, z.ZodType<FormValues>>;

type FormValues = { email: string; password: string; code: string };

/** What the user signed in with: a password, or the code you emailed them. */
export type SignIn03Values =
  | { method: "password"; email: string; password: string }
  | { method: "code"; email: string; code: string };

export type SignIn03Props = {
  /**
   * Sign the user in with your auth backend, with a password or the emailed code. Throw to show
   * the error as a toast; resolve and a "Signed in" toast appears (navigate away here). Store any
   * session in expo-secure-store.
   */
  onSubmit?: (values: SignIn03Values) => void | Promise<void>;
  /**
   * Email a 6-digit sign-in code (on "Email me a code instead" and on "Resend"). Throw to show
   * the error as a toast and stay on the password step.
   */
  onSendCode?: (email: string) => void | Promise<void>;
};

export function SignIn03({ onSubmit, onSendCode }: SignIn03Props) {
  const styles = useStyles();
  const { controlHeight, spacing } = useTheme();
  const [step, setStep] = useState<Step>("email");
  const [sending, setSending] = useState(false);
  // Each step change moves the screen reader to the new title (or, without one, the keyboard to
  // the new field).
  const { headingRef, autoFocus } = useStepFocus(step);
  const {
    control,
    handleSubmit,
    getValues,
    clearErrors,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schemas[step]),
    defaultValues: { email: "", password: "", code: "" },
  });

  const goTo = (next: Step) => {
    clearErrors();
    setStep(next);
  };
  const back = previous[step];

  // Android's back button steps back through the form before it leaves the Screen.
  useEffect(() => {
    if (!back) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      clearErrors();
      setStep(back);
      return true;
    });
    return () => subscription.remove();
  }, [back, clearErrors]);

  const next = handleSubmit(async ({ email, password, code }) => {
    if (step === "email") return goTo("password");
    const values: SignIn03Values =
      step === "password"
        ? { method: "password", email, password }
        : { method: "code", email, code };
    try {
      await onSubmit?.(values);
      toast.success("Signed in");
    } catch (error) {
      toast.error("Couldn't sign in", { description: messageOf(error) });
    }
  });

  const sendCode = async () => {
    const address = getValues("email").trim();
    setSending(true);
    try {
      await onSendCode?.(address);
      toast.success("Code sent", { description: `Check ${address}` });
      goTo("code");
    } catch (error) {
      toast.error("Couldn't send the code", { description: messageOf(error) });
    } finally {
      setSending(false);
    }
  };

  const shownEmail = getValues("email").trim();
  const copy = {
    email: { title: "What's your email?", subtitle: "Enter the email for your account." },
    password: { title: "Enter your password", subtitle: `for ${shownEmail}` },
    code: { title: "Check your email", subtitle: `Enter the 6-digit code sent to ${shownEmail}` },
  }[step];

  return (
    <View style={styles.root}>
      <Container
        edges={["top"]}
        // Keep the focused field clear of the footer that rides above the keyboard.
        extraKeyboardSpace={controlHeight.lg + spacing[3] * 2}
        contentContainerStyle={styles.content}
      >
        {back ? (
          <Button
            variant="ghost"
            icon={ChevronLeft}
            aria-label="Back"
            onPress={() => goTo(back)}
            style={styles.back}
          />
        ) : null}

        <View style={styles.heading}>
          <Text variant="h1" ref={headingRef}>
            {copy.title}
          </Text>
          <Text variant="body" color="mutedForeground">
            {copy.subtitle}
          </Text>
        </View>

        <FocusChain onSubmit={next}>
          {step === "email" ? (
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
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </FormField>
              )}
            />
          ) : step === "password" ? (
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <FormField label="Password" error={fieldState.error?.message}>
                  <Input
                    ref={field.ref}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoFocus={autoFocus}
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
                  />
                </FormField>
              )}
            />
          ) : (
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
          )}
        </FocusChain>

        {step === "password" ? (
          <Button
            variant="link"
            size="sm"
            label="Email me a code instead"
            loading={sending}
            disabled={isSubmitting}
            onPress={sendCode}
            style={styles.link}
          />
        ) : null}
        {step === "code" ? (
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
              onPress={sendCode}
              style={styles.inline}
            />
          </View>
        ) : null}
      </Container>

      <KeyboardStickyFooter style={styles.footer}>
        <Button
          size="lg"
          label={step === "email" ? "Continue" : step === "password" ? "Sign in" : "Verify"}
          loading={isSubmitting}
          disabled={sending}
          onPress={next}
        />
      </KeyboardStickyFooter>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  content: { paddingHorizontal: t.spacing[6], paddingTop: t.spacing[4] },
  // The chevron lines up with the content's edge; the tap area stays 48.
  back: { alignSelf: "flex-start", marginStart: -t.spacing[3] },
  heading: { gap: t.spacing[2], marginTop: t.spacing[4], marginBottom: t.spacing[4] },
  link: { alignSelf: "flex-start", paddingHorizontal: 0 },
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
