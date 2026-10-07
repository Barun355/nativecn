import { Stack, router, useLocalSearchParams, type Href } from "expo-router";
import { CircleAlert, Play } from "lucide-react-native";
import { View } from "react-native";

import { useRegistryComponent } from "@/components/registry-module";
import {
  COMPONENT_GROUPS,
  LAYOUT_EXAMPLES,
  SCREEN_EXAMPLES,
  groupOf,
  showcaseHref,
  usedBy,
} from "@/catalog";
import { registryIndex } from "@/registry-index";
import { Alert, AlertDescription, AlertTitle } from "@/registry/components/alert";
import { Badge } from "@/registry/components/badge";
import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { EmptyState } from "@/registry/components/empty-state";
import { Separator } from "@/registry/components/separator";
import { Spinner } from "@/registry/components/spinner";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

// A Component's page: its live examples (the same files as the docs, so every Variant, Size,
// State and Status they show), its accessibility facts, and what is built on it. Primitives, the
// Theme and helpers get the same page without examples.
export default function ComponentScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const styles = useStyles();
  const item = registryIndex[name];

  if (!item) {
    return (
      <Container edges={["bottom"]}>
        <Stack.Screen options={{ title: "Not found" }} />
        <EmptyState icon={CircleAlert} title={`No item named "${name}"`} />
      </Container>
    );
  }

  const builtOnIt = usedBy(registryIndex, name);

  return (
    <Container edges={["bottom"]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: item.title }} />
      <View style={styles.header}>
        <View style={styles.badges}>
          <Badge label={item.kind || "Item"} variant="secondary" />
          {item.kind === "Component" ? (
            <Badge
              label={COMPONENT_GROUPS.find((g) => g.id === groupOf(item))!.title}
              variant="outline"
            />
          ) : null}
        </View>
        <Text variant="body" color="mutedForeground">
          {item.description}
        </Text>
      </View>

      {item.examples.map((example) => (
        <Example key={example} name={example} />
      ))}

      {item.a11y.length ? (
        <View style={styles.section}>
          <Text variant="h4">Accessibility</Text>
          {item.a11y.map((fact) => (
            <Text key={fact} variant="small" color="mutedForeground">
              • {fact}
            </Text>
          ))}
        </View>
      ) : null}

      {builtOnIt.length ? (
        <View style={styles.section}>
          <Text variant="h4">Built on it</Text>
          <View style={styles.links}>
            {builtOnIt.map((user) => (
              <Button
                key={user.name}
                label={user.title}
                variant="outline"
                size="sm"
                onPress={() => {
                  const href = showcaseHref(registryIndex, user.name);
                  if (href) router.push(href as Href);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}
    </Container>
  );
}

/** One example, rendered live; a Layout or whole-Screen example opens on its own. */
function Example({ name }: { name: string }) {
  const styles = useStyles();
  const entry = registryIndex[name];
  const layout = LAYOUT_EXAMPLES[name];
  const fullScreen = SCREEN_EXAMPLES.has(name);

  return (
    <View style={styles.section}>
      <Text variant="h4">Example</Text>
      {entry ? (
        <Text variant="small" color="mutedForeground">
          {entry.description}
        </Text>
      ) : null}
      {layout || fullScreen ? (
        <Button
          label={layout ? "Open the live Layout" : "Open the Screen"}
          icon={Play}
          variant="secondary"
          style={styles.open}
          onPress={() =>
            router.push(
              layout ? (layout as Href) : { pathname: "/example/[name]", params: { name } },
            )
          }
        />
      ) : (
        <View style={styles.frame}>
          <LiveExample name={name} />
        </View>
      )}
      <Separator />
    </View>
  );
}

function LiveExample({ name }: { name: string }) {
  const { Component: Demo, error } = useRegistryComponent(name);
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load {name}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  return Demo ? <Demo /> : <Spinner />;
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[6] },
  header: { gap: t.spacing[3] },
  badges: { flexDirection: "row", gap: t.spacing[2] },
  section: { gap: t.spacing[3] },
  frame: {
    padding: t.spacing[4],
    borderRadius: t.radius.lg,
    borderCurve: "continuous",
    borderWidth: t.borderWidth.default,
    borderColor: t.colors.border,
    backgroundColor: t.colors.background,
  },
  open: { alignSelf: "flex-start" },
  links: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[2] },
}));
