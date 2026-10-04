import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { createStyles } from "@/registry/theme";

type ScreenProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

/** A scrolling tab Screen with a heading. Placeholder chrome until the Showcase's own Components land. */
export function Screen({ title, description, children }: ScreenProps) {
  const styles = useStyles();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text role="heading" style={styles.title}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const useStyles = createStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  content: { padding: t.spacing[4], gap: t.spacing[2] },
  title: { ...t.type.h2, color: t.colors.foreground },
  description: { ...t.type.body, color: t.colors.mutedForeground },
  body: { marginTop: t.spacing[4], gap: t.spacing[3] },
}));
