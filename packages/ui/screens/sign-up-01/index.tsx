import {
  Controller,
  useForm,
  type FieldError,
  type FieldErrors,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";

import { Button } from "@/registry/components/button";
import { Checkbox } from "@/registry/components/checkbox";
import { Container } from "@/registry/components/container";
import { FormField } from "@/registry/components/form-field";
import { Input } from "@/registry/components/input";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { Separator } from "@/registry/components/separator";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";
import { createStyles } from "@/registry/theme";

import { SocialButtons, type SocialProvider } from "./components/social-buttons";

export type { SocialProvider } from "./components/social-buttons";

// sign-up-01, classic single form: Apple and Google on top, "or", then name, email and password,
// a terms Checkbox and one Create account button. Edit the copy and the rules below; they are
// yours.

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
  password: z.string().min(8, "Use at least 8 characters"),
  terms: z.boolean().refine((accepted) => accepted, "Accept the Terms to continue"),
});

/** What the user signed up with (the terms were accepted, or the form would not submit). */
export type SignUp01Values = Omit<z.infer<typeof schema>, "terms">;

export type SignUp01Props = {
  /**
   * Create the account with your auth backend. Throw to show the error as a toast; resolve and
   * an "Account created" toast appears (navigate away here). Store any session in
   * expo-secure-store.
   */
  onSubmit?: (values: SignUp01Values) => void | Promise<void>;
  /** Run the provider's sign-up. Throw to show the error as a toast. */
  onSocialSignIn?: (provider: SocialProvider) => void | Promise<void>;
  /** The Terms link under the checkbox. */
  onTermsPress?: () => void;
  /** The Privacy Policy link under the checkbox. */
  onPrivacyPress?: () => void;
  /** The Sign in link. */
  onSignIn?: () => void;
};

export function SignUp01({
  onSubmit,
  onSocialSignIn,
  onTermsPress,
  onPrivacyPress,
  onSignIn,
}: SignUp01Props) {
  const styles = useStyles();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", terms: false },
  });

  const submit = handleSubmit(async ({ terms: _accepted, ...values }) => {
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

  return (
    <Container contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="h2">Create an account</Text>
        <Text variant="small" color="mutedForeground">
          Enter your details to get started.
        </Text>
      </View>

      <SocialButtons onPress={socialSignIn} disabled={isSubmitting} />

      <View style={styles.divider}>
        <Separator style={styles.line} />
        <Text variant="caption" color="mutedForeground">
          or
        </Text>
        <Separator style={styles.line} />
      </View>

      <FocusChain onSubmit={submit}>
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
                placeholder="Jane Doe"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
            </FormField>
          )}
        />
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
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField
              label="Password"
              description="At least 8 characters."
              error={fieldState.error?.message}
            >
              <Input
                ref={field.ref}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
            </FormField>
          )}
        />
      </FocusChain>

      <View style={styles.terms}>
        <Controller
          control={control}
          name="terms"
          render={({ field, fieldState }) => (
            <FormField error={fieldState.error?.message}>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                label="I agree to the Terms and Privacy Policy"
              />
            </FormField>
          )}
        />
        <View style={styles.legal}>
          <Button
            variant="link"
            size="sm"
            label="Terms"
            onPress={onTermsPress}
            style={styles.inline}
          />
          <Text variant="small" color="mutedForeground" aria-hidden>
            ·
          </Text>
          <Button
            variant="link"
            size="sm"
            label="Privacy Policy"
            onPress={onPrivacyPress}
            style={styles.inline}
          />
        </View>
      </View>

      <Button label="Create account" loading={isSubmitting} onPress={submit} />

      <View style={styles.footer}>
        <Text variant="small" color="mutedForeground">
          Already have an account?
        </Text>
        <Button variant="link" size="sm" label="Sign in" onPress={onSignIn} style={styles.inline} />
      </View>
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  content: { paddingHorizontal: t.spacing[6], paddingTop: t.spacing[8] },
  header: { gap: t.spacing[1], marginBottom: t.spacing[2] },
  divider: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  line: { flex: 1 },
  terms: { gap: t.spacing[1] },
  legal: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: t.spacing[2],
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[1],
  },
  inline: { paddingHorizontal: 0 },
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
