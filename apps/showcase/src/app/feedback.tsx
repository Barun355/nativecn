import { Stack } from "expo-router";
import { Upload } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";

import { failsOnPurpose, FAKE_LATENCY } from "@/demo-callbacks";
import { Alert, AlertDescription, AlertTitle } from "@/registry/components/alert";
import { Avatar } from "@/registry/components/avatar";
import { Button } from "@/registry/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/components/card";
import { Container } from "@/registry/components/container";
import { FormField } from "@/registry/components/form-field";
import { Input } from "@/registry/components/input";
import { FocusChain } from "@/registry/components/primitives/focus-chain";
import { Progress } from "@/registry/components/progress";
import { Skeleton } from "@/registry/components/skeleton";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";
import { createStyles } from "@/registry/theme";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The Feedback group's live demos (decision #29): Toast, Alert, Skeleton, Progress, field
// validation errors and loading Buttons, wired the way an app uses them.
export default function FeedbackScreen() {
  const styles = useStyles();
  return (
    <Container edges={["bottom"]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Feedback demos" }} />
      <ToastsCard />
      <FormCard />
      <LoadingCard />
      <UploadCard />
    </Container>
  );
}

function ToastsCard() {
  const styles = useStyles();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Toasts</CardTitle>
        <CardDescription>
          At most three stack; each leaves after 4 seconds, or swipe it away.
        </CardDescription>
      </CardHeader>
      <CardContent style={styles.buttons}>
        <Button label="Saved" variant="outline" size="sm" onPress={() => toast("Draft saved")} />
        <Button
          label="Success"
          variant="outline"
          size="sm"
          onPress={() => toast.success("Profile updated")}
        />
        <Button
          label="Error"
          variant="outline"
          size="sm"
          onPress={() => toast.error("Wrong password", { description: "Check it and try again." })}
        />
        <Button
          label="Warning"
          variant="outline"
          size="sm"
          onPress={() => toast.warning("Storage almost full")}
        />
        <Button
          label="With action"
          variant="outline"
          size="sm"
          onPress={() =>
            toast("Message archived", {
              action: { label: "Undo", onPress: () => toast.info("Message restored") },
            })
          }
        />
        <Button label="Dismiss all" variant="ghost" size="sm" onPress={() => toast.dismiss()} />
      </CardContent>
    </Card>
  );
}

const profileSchema = {
  name: z.string().trim().min(1, "Enter your name"),
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
};

/** A zod field schema as a react-hook-form rule: the first issue's message, or valid. */
const rule = (schema: z.ZodType) => ({
  validate: (value: unknown) => {
    const result = schema.safeParse(value);
    return result.success || result.error.issues[0]?.message;
  },
});

/** Field errors under each field, a loading Button, then an Alert and a Toast for the result. */
function FormCard() {
  const styles = useStyles();
  const [result, setResult] = useState<"saved" | "failed">();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { name: "", email: "" } });

  const submit = handleSubmit(async (values) => {
    setResult(undefined);
    await wait(FAKE_LATENCY);
    if (failsOnPurpose([values])) {
      setResult("failed");
      toast.error("Couldn't save", { description: "The demo server refuses emails with error." });
    } else {
      setResult("saved");
      toast.success("Profile saved");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field errors and loading</CardTitle>
        <CardDescription>
          Save it empty for field errors. An email containing &quot;error&quot; fails.
        </CardDescription>
      </CardHeader>
      <CardContent style={styles.form}>
        {result === "saved" ? (
          <Alert variant="success">
            <AlertTitle>Profile saved</AlertTitle>
          </Alert>
        ) : result === "failed" ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save your profile</AlertTitle>
            <AlertDescription>Check your email and try again.</AlertDescription>
          </Alert>
        ) : null}
        <FocusChain onSubmit={submit}>
          <Controller
            control={control}
            name="name"
            rules={rule(profileSchema.name)}
            render={({ field, fieldState }) => (
              <FormField label="Name" error={fieldState.error?.message} required>
                <Input
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete="name"
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="email"
            rules={rule(profileSchema.email)}
            render={({ field, fieldState }) => (
              <FormField label="Email" error={fieldState.error?.message} required>
                <Input
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </FormField>
            )}
          />
        </FocusChain>
        <Button
          label="Save"
          loading={isSubmitting}
          status={result === "saved" ? "success" : result === "failed" ? "error" : undefined}
          onPress={submit}
        />
      </CardContent>
    </Card>
  );
}

/** Skeletons while a row "loads", then the content. */
function LoadingCard() {
  const styles = useStyles();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loading content</CardTitle>
        <CardDescription>Skeletons hold the layout while data loads.</CardDescription>
      </CardHeader>
      <CardContent style={styles.form}>
        <View style={styles.row} aria-busy={loading}>
          {loading ? (
            <>
              <Skeleton circle height={40} />
              <View style={styles.lines}>
                <Skeleton height={14} width="60%" />
                <Skeleton height={12} width="40%" />
              </View>
            </>
          ) : (
            <>
              <Avatar fallback="JD" />
              <View style={styles.lines}>
                <Text variant="label">Jane Doe</Text>
                <Text variant="small" color="mutedForeground">
                  jane@example.com
                </Text>
              </View>
            </>
          )}
        </View>
        <Button
          label="Reload"
          variant="outline"
          size="sm"
          disabled={loading}
          onPress={() => setLoading(true)}
          style={styles.start}
        />
      </CardContent>
    </Card>
  );
}

/** A fake upload: Progress fills, then an indeterminate bar while it "processes", then a Toast. */
function UploadCard() {
  const styles = useStyles();
  const [progress, setProgress] = useState<number | "processing">();
  const running = useRef(false);

  useEffect(() => () => void (running.current = false), []);

  const upload = async () => {
    running.current = true;
    for (let value = 0; value <= 100 && running.current; value += 20) {
      setProgress(value);
      await wait(400);
    }
    if (!running.current) return;
    setProgress("processing");
    await wait(1200);
    if (!running.current) return;
    running.current = false;
    setProgress(undefined);
    toast.success("Photo uploaded");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
        <CardDescription>A determinate upload, then an indeterminate step.</CardDescription>
      </CardHeader>
      <CardContent style={styles.form}>
        {progress === undefined ? null : (
          <View style={styles.lines}>
            <Progress
              value={progress === "processing" ? 100 : progress}
              indeterminate={progress === "processing"}
            />
            <Text variant="caption" color="mutedForeground">
              {progress === "processing" ? "Processing…" : `Uploading… ${progress}%`}
            </Text>
          </View>
        )}
        <Button
          label="Upload a photo"
          icon={Upload}
          variant="secondary"
          loading={progress !== undefined}
          onPress={upload}
          style={styles.start}
        />
      </CardContent>
    </Card>
  );
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[4] },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[2] },
  form: { gap: t.spacing[4] },
  row: { flexDirection: "row", alignItems: "center", gap: t.spacing[3] },
  lines: { flex: 1, gap: t.spacing[2] },
  start: { alignSelf: "flex-start" },
}));
