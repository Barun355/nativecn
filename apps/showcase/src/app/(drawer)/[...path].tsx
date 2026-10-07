import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Drawer, type DrawerNavigationProp } from "expo-router/drawer";
import { ArrowLeft, Menu } from "lucide-react-native";
import { View } from "react-native";

import { optionLabel } from "@/preset/preset";
import { registryIndex } from "@/registry-index";
import { Button } from "@/registry/components/button";
import { Container } from "@/registry/components/container";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

/** "Same-day delivery" for /delivery, the panel's title for /drawers/drawer-01. */
function screenTitle(path: string[]): string {
  if (path[0] === "drawers" && path[1]) return registryIndex[path[1]]?.title ?? path[1];
  return optionLabel(path.at(-1) ?? "home");
}

// Every path a drawer panel's items link to lands here, inside the drawer Layout.
export default function DrawerPathScreen() {
  const styles = useStyles();
  const { path } = useLocalSearchParams<{ path: string[] }>();
  const segments = [path].flat().filter(Boolean);
  const navigation = useNavigation<DrawerNavigationProp<Record<string, undefined>>>();
  const title = screenTitle(segments);

  return (
    <Container edges={["bottom"]} contentContainerStyle={styles.content}>
      <Drawer.Screen options={{ title }} />
      <View style={styles.text}>
        <Text variant="h2">{title}</Text>
        <Text color="mutedForeground">
          A real expo-router/drawer Layout. Open the menu with the button below, the header or a
          swipe from the left edge, then tap an item: it navigates here and closes the drawer.
        </Text>
      </View>
      <Button label="Open the menu" icon={Menu} onPress={() => navigation.openDrawer()} />
      <Button
        label="Back to Blocks"
        icon={ArrowLeft}
        variant="outline"
        onPress={() => router.navigate("/blocks")}
      />
    </Container>
  );
}

const useStyles = createStyles((t) => ({
  content: { gap: t.spacing[4] },
  text: { gap: t.spacing[2] },
}));
