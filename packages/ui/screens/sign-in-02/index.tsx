import { Hexagon } from "lucide-react-native";
import { use, useState } from "react";
import {
  Controller,
  useForm,
  type FieldError,
  type FieldErrors,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import { StatusBar, View } from "react-native";
import { SafeAreaInsetsContext, initialWindowMetrics } from "react-native-safe-area-context";
import { z } from "zod";

import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { FormField } from "@/registry/components/form-field";
import { Icon } from "@/registry/components/icon";
import { Input } from "@/registry/components/input";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { Separator } from "@/registry/components/separator";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";
import { ThemeProvider, createStyles, useTheme } from "@/registry/theme";

import { SocialButtons, type SocialProvider } from "./components/social-buttons";

export type { SocialProvider } from "./components/social-buttons";

// sign-in-02, social-first hero: a dark brand hero with the logo, headline and subtitle centred;
// Apple and Google are the main path, and "Continue with email" reveals the email form.
// Edit the copy, the logo and the rules below; they are yours.

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required"),
});

export type SignIn02Values = z.infer<typeof schema>;

export type SignIn02Props = {
  /**
   * Sign the user in with your auth backend. Throw to show the error as a toast; resolve and a
   * "Signed in" toast appears (navigate away here). Store any session in expo-secure-store.
   */
  onSubmit?: (values: SignIn02Values) => void | Promise<void>;
  /** Run the provider's sign-in. Throw to show the error as a toast. */
  onSocialSignIn?: (provider: SocialProvider) => void | Promise<void>;
};

export function SignIn02({ onSubmit, onSocialSignIn }: SignIn02Props) {
  const styles = useStyles();
  const [emailOpen, setEmailOpen] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignIn02Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit?.(values);
      toast.success("Signed in");
    } catch (error) {
      toast.error("Couldn't sign in", { description: messageOf(error) });
    }
  });

  const socialSignIn = async (provider: SocialProvider) => {
    try {
      await onSocialSignIn?.(provider);
    } catch (error) {
      toast.error("Couldn't sign in", { description: messageOf(error) });
    }
  };

  return (
    <Container edges={["bottom"]} padded={false} contentContainerStyle={styles.content}>
      {/* The hero is dark in both Schemes, so the status bar above it is light. */}
      <StatusBar barStyle="light-content" />
      <ThemeProvider scheme="dark">
        <Hero />
      </ThemeProvider>

      <View style={styles.panel}>
        <SocialButtons size="lg" onPress={socialSignIn} disabled={isSubmitting} />

        {emailOpen ? (
          <>
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
                name="email"
                render={({ field, fieldState }) => (
                  <FormField label="Email" error={fieldState.error?.message}>
                    <Input
                      ref={field.ref}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      autoFocus
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
                  <FormField label="Password" error={fieldState.error?.message}>
                    <Input
                      ref={field.ref}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      secureTextEntry
                      autoComplete="current-password"
                      textContentType="password"
                    />
                  </FormField>
                )}
              />
            </FocusChain>
            <Button size="lg" label="Sign in" loading={isSubmitting} onPress={submit} />
          </>
        ) : (
          <Button
            variant="ghost"
            size="lg"
            label="Continue with email"
            onPress={() => setEmailOpen(true)}
          />
        )}

        <Text variant="caption" color="mutedForeground" align="center" style={styles.terms}>
          By continuing you agree to the Terms and Privacy Policy.
        </Text>
      </View>
    </Container>
  );
}

/** The brand hero, rendered inside a dark ThemeProvider so every Colour Role is the dark one. */
function Hero() {
  const styles = useHeroStyles();
  const { spacing } = useTheme();
  const insets = use(SafeAreaInsetsContext) ?? initialWindowMetrics?.insets;
  return (
    // The hero runs under the status bar, so its top padding includes the status bar inset.
    <View style={[styles.hero, { paddingTop: (insets?.top ?? 0) + spacing[10] }]}>
      {/* Your logo goes here. */}
      <View style={styles.logo}>
        <Icon icon={Hexagon} size="lg" color="primaryForeground" />
      </View>
      <Text variant="h1" align="center">
        {"Your app,\neverywhere."}
      </Text>
      <Text variant="body" color="mutedForeground" align="center">
        Sign in to pick up where you left off.
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  content: { gap: 0 },
  panel: {
    marginTop: -t.spacing[5],
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[6],
    paddingTop: t.spacing[6],
    paddingBottom: t.spacing[8],
    borderTopLeftRadius: t.radius["2xl"],
    borderTopRightRadius: t.radius["2xl"],
    borderCurve: "continuous",
    backgroundColor: t.colors.background,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing[3],
    marginVertical: t.spacing[2],
  },
  line: { flex: 1 },
  terms: { marginTop: t.spacing[2] },
}));

const useHeroStyles = createStyles((t) => ({
  hero: {
    flexGrow: 1,
    minHeight: t.scaleValue(360),
    alignItems: "center",
    justifyContent: "center",
    gap: t.spacing[3],
    paddingHorizontal: t.spacing[6],
    // Room for the panel's rounded top, which overlaps the hero.
    paddingBottom: t.spacing[10],
    backgroundColor: t.colors.background,
  },
  logo: {
    width: t.scaleValue(64),
    height: t.scaleValue(64),
    marginBottom: t.spacing[2],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radius["2xl"],
    borderCurve: "continuous",
    backgroundColor: t.colors.primary,
  },
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
