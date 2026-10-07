import { Stack, useLocalSearchParams } from "expo-router";

import { useRegistryComponent } from "@/components/registry-module";
import { registryIndex } from "@/registry-index";
import { Container } from "@/registry/components/container";
import { Spinner } from "@/registry/components/spinner";

// An example that is a whole Screen (it brings its own Container, safe area included), shown as
// the Screen itself with no header. System back (or swipe back on iOS) returns.
export default function ExampleScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { Component: Demo } = useRegistryComponent(name);
  return (
    <>
      <Stack.Screen options={{ title: registryIndex[name]?.title ?? name, headerShown: false }} />
      {Demo ? (
        <Demo />
      ) : (
        <Container>
          <Spinner />
        </Container>
      )}
    </>
  );
}
