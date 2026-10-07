import { useLocalSearchParams } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import { useMemo } from "react";

import { demoHandlers } from "@/components/demo-handlers";
import { useRegistryComponent } from "@/components/registry-module";
import { registryIndex } from "@/registry-index";
import { Container } from "@/registry/components/container";
import { EmptyState } from "@/registry/components/empty-state";
import { Spinner } from "@/registry/components/spinner";

// A Screen Block running for real, as `add --route` wires it: the Block is the whole Screen, its
// form validates for real, and its callbacks go to a fake server (see demo-handlers.ts).
export default function BlockScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const entry = registryIndex[name];
  const { Component: Block, error } = useRegistryComponent(
    entry ? name : undefined,
    entry?.component,
  );
  const handlers = useMemo(() => demoHandlers(entry?.callbacks ?? []), [entry]);

  if (!entry || error) {
    return (
      <Container>
        <EmptyState
          icon={CircleAlert}
          title={entry ? `Couldn't load ${name}` : `No Block named "${name}"`}
          description={error?.message}
        />
      </Container>
    );
  }
  if (!Block) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  }
  return <Block {...handlers} />;
}
