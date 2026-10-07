import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { ListItem, ListSection } from "@/registry/components/list";
import {
  SegmentedTabs,
  SegmentedTabsContent,
  SegmentedTabsList,
  SegmentedTabsTrigger,
  type SegmentedTabsVariant,
} from "@/registry/components/segmented-tabs";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

type DemoTabProps = {
  title: string;
  /** In-screen tabs shown in context, under the bottom TabNavigation. */
  segments: string[];
  variant?: SegmentedTabsVariant;
  /** Show the way back to the Showcase. */
  exit?: boolean;
};

/** One tab of the TabNavigation demo: SegmentedTabs in context, each with placeholder rows. */
export function DemoTab({ title, segments, variant, exit = false }: DemoTabProps) {
  const styles = useStyles();
  return (
    <Container edges={[]} padded={false} contentContainerStyle={styles.content}>
      <SegmentedTabs defaultValue={segments[0]} variant={variant} style={styles.padded}>
        <SegmentedTabsList>
          {segments.map((segment) => (
            <SegmentedTabsTrigger key={segment} value={segment} label={segment} />
          ))}
        </SegmentedTabsList>
        {segments.map((segment) => (
          <SegmentedTabsContent key={segment} value={segment} style={styles.panel}>
            <Text variant="small" color="mutedForeground">
              {title} › {segment}: SegmentedTabs switch content inside this Screen; TabNavigation
              below moves between Screens.
            </Text>
          </SegmentedTabsContent>
        ))}
      </SegmentedTabs>
      <ListSection>
        {[1, 2, 3].map((n) => (
          <ListItem key={n} title={`${title} item ${n}`} description="Placeholder row" />
        ))}
      </ListSection>
      {exit ? (
        <Button
          label="Back to Blocks"
          icon={ArrowLeft}
          variant="outline"
          onPress={() => router.navigate("/blocks")}
          style={styles.padded}
        />
      ) : null}
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[6], paddingVertical: t.spacing[4] },
  padded: { marginHorizontal: t.spacing[4] },
  panel: { paddingTop: t.spacing[3] },
}));
