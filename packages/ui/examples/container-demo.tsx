import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { Text } from "@/registry/components/text";

/**
 * A Screen wrapped in Container: safe-area edges, scrolling, keyboard avoidance, Token padding
 * and a 640 max width, all on by default.
 */
export default function ContainerDemo() {
  return (
    <Container>
      <Text variant="h2">Settings</Text>
      <Text color="mutedForeground">
        Content scrolls, stays clear of the notch and home indicator, and keeps the focused field
        above the keyboard.
      </Text>
      <Button label="Save changes" />
    </Container>
  );
}
