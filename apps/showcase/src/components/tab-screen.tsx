import type { ReactNode } from "react";
import { View } from "react-native";

import { Container } from "@/registry/components/container";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

type TabScreenProps = {
  title: string;
  description?: string;
  /** Rows that bring their own side margins (ListSections), drawn edge to edge. */
  children?: ReactNode;
};

/**
 * A tab's Screen: a heading and description, then the content, in a Container. The tab bar below
 * keeps clear of the bottom safe area, so only the top edge is padded here.
 */
export function TabScreen({ title, description, children }: TabScreenProps) {
  const styles = useStyles();
  return (
    <Container edges={["top"]} padded={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="h1">{title}</Text>
        {description ? (
          <Text variant="body" color="mutedForeground">
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </Container>
  );
}

/** Content inside a TabScreen that needs the Screen's side padding (text, Buttons, Cards). */
export function Padded({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.padded}>{children}</View>;
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[6], paddingTop: t.spacing[4], paddingBottom: t.spacing[8] },
  header: { gap: t.spacing[2], paddingHorizontal: t.spacing[4] },
  padded: { gap: t.spacing[3], paddingHorizontal: t.spacing[4] },
}));
