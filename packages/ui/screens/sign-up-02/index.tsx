import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Controller,
  useForm,
  type FieldError,
  type FieldErrors,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import { BackHandler, View } from "react-native";
import { z } from "zod";

import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { FormField } from "@/registry/components/form-field";
import { Input } from "@/registry/components/input";
import { InputOTP } from "@/registry/components/input-otp";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { KeyboardStickyFooter } from "@/registry/components/primitives/keyboard";
import { Progress } from "@/registry/components/progress";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";
import { createStyles, useTheme } from "@/registry/theme";

// sign-up-02, a step-by-step wizard: one question per step under a Progress bar, in the order
// email, name, password, then the 6-digit code you emailed. The step is kept inside the Block.
// Edit the copy, the steps and the rules below; they are yours.

/** The steps, in order. Back goes to the previous one. */
const steps = ["email", "name", "password", "code"] as const;
type Step = (typeof steps)[number];

const email = z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email"));
const name = z.string().trim().min(1, "Enter your name");
const password = z.string().min(8, "Use at least 8 characters");
const code = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");
/** Each step checks its own field and the ones before it; later ones pass through. */
const schemas = {
  email: z.object({ email, name: z.string(), password: z.string(), code: z.string() }),
  name: z.object({ email, name, password: z.string(), code: z.string() }),
  password: z.object({ email, name, password, code: z.string() }),
  code: z.object({ email, name, password, code }),
} satisfies Record<Step, z.ZodType<FormValues>>;

type FormValues = { email: string; name: string; password: string; code: string };

/** The details collected before the code step. */
export type SignUp02Details = Omit<FormValues, "code">;
/** The details plus the code the user typed. */
export type SignUp02Values = FormValues;

export type SignUp02Props = {
  /**
   * Register the details with your auth backend and email a 6-digit code (after the password
   * step, and again on "Resend", so make it safe to repeat). Throw to show the error as a toast
   * and stay on the password step.
   */
  onSendCode?: (details: SignUp02Details) => void | Promise<void>;
  /**
   * Check the code and finish creating the account. Throw to show the error as a toast; resolve
   * and an "Account created" toast appears (navigate away here). Store any session in
   * expo-secure-store.
   */
  onSubmit?: (values: SignUp02Values) => void | Promise<void>;
};

export function SignUp02({ onSendCode, onSubmit }: SignUp02Props) {
  const styles = useStyles();
  const { controlHeight, spacing } = useTheme();
  const [step, setStep] = useState<Step>("email");
  const [resending, setResending] = useState(false);
  const {
    control,
    handleSubmit,
    getValues,
    clearErrors,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schemas[step]),
    defaultValues: { email: "", name: "", password: "", code: "" },
  });

  const index = steps.indexOf(step);
  const back = steps[index - 1];

  const goTo = (next: Step) => {
    clearErrors();
    setStep(next);
  };

  // Android's back button steps back through the wizard before it leaves the Screen.
  useEffect(() => {
    if (!back) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      clearErrors();
      setStep(back);
      return true;
    });
    return () => subscription.remove();
  }, [back, clearErrors]);

  /** Sends the code; says so in a toast. Returns whether it worked. */
  const sendCode = async ({ code: _code, ...details }: FormValues) => {
    try {
      await onSendCode?.(details);
      toast.success("Code sent", { description: `Check ${details.email}` });
      return true;
    } catch (error) {
      toast.error("Couldn't send the code", { description: messageOf(error) });
      return false;
    }
  };

  const next = handleSubmit(async (values) => {
    if (step === "email") return goTo("name");
    if (step === "name") return goTo("password");
    if (step === "password") {
      if (await sendCode(values)) goTo("code");
      return;
    }
    try {
      await onSubmit?.(values);
      toast.success("Account created");
    } catch (error) {
      toast.error("Couldn't create your account", { description: messageOf(error) });
    }
  });

  const resend = async () => {
    setResending(true);
    // The details were validated on the way here; trim them as they were the first time.
    const values = getValues();
    await sendCode({ ...values, email: values.email.trim(), name: values.name.trim() });
    setResending(false);
  };

  const shownEmail = getValues("email").trim();
  const copy = {
    email: { title: "What's your email?", subtitle: "We'll send a code to confirm it." },
    name: { title: "What should we call you?", subtitle: "This is shown on your profile." },
    password: { title: "Create a password", subtitle: "At least 8 characters." },
    code: { title: "Verify your email", subtitle: `Enter the 6-digit code sent to ${shownEmail}` },
  }[step];

  return (
    <View style={styles.root}>
      <Container
        edges={["top"]}
        // Keep the focused field clear of the footer that rides above the keyboard.
        extraKeyboardSpace={controlHeight.lg + spacing[3] * 2}
        contentContainerStyle={styles.content}
      >
        <View style={styles.bar}>
          {back ? (
            <Button
              variant="ghost"
              icon={ChevronLeft}
              aria-label="Back"
              onPress={() => goTo(back)}
              style={styles.back}
            />
          ) : null}
          <Progress
            value={((index + 1) / steps.length) * 100}
            aria-label={`Step ${index + 1} of ${steps.length}`}
            style={styles.progress}
          />
          <Text variant="caption" color="mutedForeground" aria-hidden>
            {`${index + 1}/${steps.length}`}
          </Text>
        </View>

        <View style={styles.heading}>
          <Text variant="h1">{copy.title}</Text>
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
          ) : step === "name" ? (
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <FormField label="Full name" error={fieldState.error?.message}>
                  <Input
                    ref={field.ref}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoFocus
                    placeholder="Jane Doe"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
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
                    autoFocus
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
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
                    autoFocus
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                  />
                </FormField>
              )}
            />
          )}
        </FocusChain>

        {step === "code" ? (
          <View style={styles.resend}>
            <Text variant="small" color="mutedForeground">
              Didn&apos;t get it?
            </Text>
            <Button
              variant="link"
              size="sm"
              label="Resend"
              loading={resending}
              disabled={isSubmitting}
              onPress={resend}
              style={styles.inline}
            />
          </View>
        ) : null}
      </Container>

      <KeyboardStickyFooter style={styles.footer}>
        <Button
          size="lg"
          label={step === "code" ? "Create account" : "Continue"}
          loading={isSubmitting}
          disabled={resending}
          onPress={next}
        />
      </KeyboardStickyFooter>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  content: { paddingHorizontal: t.spacing[6], paddingTop: t.spacing[2] },
  // Back, the Progress bar and the step count, on one row as tall as the Back button.
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    minHeight: t.controlHeight.md,
  },
  // The chevron lines up with the content's edge; the tap area stays 48.
  back: { marginStart: -t.spacing[3] },
  progress: { flex: 1 },
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

/** Validates the form with a zod schema and hands react-hook-form the first error per field. */
function zodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };
    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const name = issue.path.join(".");
      errors[name] ??= { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
