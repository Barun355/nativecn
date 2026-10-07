import { zodResolver } from "@hookform/resolvers/zod";
import { Hexagon } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
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
import { createStyles } from "@/registry/theme";

import { SocialButtons, type SocialProvider } from "./components/social-buttons";

export type { SocialProvider } from "./components/social-buttons";

// sign-in-01, classic centred: a logo, email and password, "or", then social sign-in, all on
// one screen. Edit the copy, the logo and the rules below; they are yours.

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required"),
});

export type SignIn01Values = z.infer<typeof schema>;

export type SignIn01Props = {
  /**
   * Sign the user in with your auth backend. Throw to show the error as a toast; resolve and a
   * "Signed in" toast appears (navigate away here). Store any session in expo-secure-store.
   */
  onSubmit?: (values: SignIn01Values) => void | Promise<void>;
  /** Run the provider's sign-in. Throw to show the error as a toast. */
  onSocialSignIn?: (provider: SocialProvider) => void | Promise<void>;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
};

export function SignIn01({ onSubmit, onSocialSignIn, onForgotPassword, onSignUp }: SignIn01Props) {
  const styles = useStyles();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignIn01Values>({
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
    <Container contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {/* Your logo goes here. */}
        <View style={styles.logo}>
          <Icon icon={Hexagon} size="lg" color="primaryForeground" />
        </View>
        <Text variant="h2" align="center">
          Welcome back
        </Text>
        <Text variant="small" color="mutedForeground" align="center">
          Sign in to your account
        </Text>
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

      <Button
        variant="link"
        size="sm"
        label="Forgot password?"
        onPress={onForgotPassword}
        style={styles.forgot}
      />
      <Button label="Sign in" loading={isSubmitting} onPress={submit} />

      <View style={styles.divider}>
        <Separator style={styles.line} />
        <Text variant="caption" color="mutedForeground">
          or
        </Text>
        <Separator style={styles.line} />
      </View>

      <SocialButtons onPress={socialSignIn} disabled={isSubmitting} />

      <View style={styles.footer}>
        <Text variant="small" color="mutedForeground">
          Don&apos;t have an account?
        </Text>
        <Button variant="link" size="sm" label="Sign up" onPress={onSignUp} style={styles.inline} />
      </View>
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  content: { paddingHorizontal: t.spacing[6], paddingTop: t.spacing[10] },
  header: { alignItems: "center", gap: t.spacing[2], marginBottom: t.spacing[4] },
  logo: {
    width: t.scaleValue(48),
    height: t.scaleValue(48),
    marginBottom: t.spacing[2],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: t.radius.xl,
    borderCurve: "continuous",
    backgroundColor: t.colors.primary,
  },
  forgot: { alignSelf: "flex-end", paddingHorizontal: 0 },
  divider: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  line: { flex: 1 },
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
