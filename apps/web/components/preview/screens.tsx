// What the preview's phone shows on each tab. The Components and Screens are the Registry's own
// source (packages/ui), rendered with react-native-web, so they look as they do in an app.

import type { ComponentType } from "react";
import { ScrollView, View } from "react-native";

import { Text } from "@/registry/components/text";
import AlertDemo from "@/registry/examples/alert-demo";
import AvatarDemo from "@/registry/examples/avatar-demo";
import BadgeDemo from "@/registry/examples/badge-demo";
import ButtonDemo from "@/registry/examples/button-demo";
import CardDemo from "@/registry/examples/card-demo";
import CheckboxDemo from "@/registry/examples/checkbox-demo";
import ChipDemo from "@/registry/examples/chip-demo";
import { InputDemo } from "@/registry/examples/input-demo";
import ProgressDemo from "@/registry/examples/progress-demo";
import RadioGroupDemo from "@/registry/examples/radio-group-demo";
import SegmentedTabsDemo from "@/registry/examples/segmented-tabs-demo";
import SkeletonDemo from "@/registry/examples/skeleton-demo";
import SwitchDemo from "@/registry/examples/switch-demo";
import TextDemo from "@/registry/examples/text-demo";
import { SignIn01 } from "@/registry/screens/sign-in-01";
import { createStyles } from "@/registry/theme";

/** The Components gallery: a sample of every group, from the same examples as the docs. */
const GALLERY: { title: string; Demo: ComponentType }[] = [
  { title: "Button", Demo: ButtonDemo },
  { title: "Badge", Demo: BadgeDemo },
  { title: "Card", Demo: CardDemo },
  { title: "Input", Demo: InputDemo },
  { title: "Checkbox", Demo: CheckboxDemo },
  { title: "Switch", Demo: SwitchDemo },
  { title: "Radio group", Demo: RadioGroupDemo },
  { title: "Chip", Demo: ChipDemo },
  { title: "Segmented tabs", Demo: SegmentedTabsDemo },
  { title: "Alert", Demo: AlertDemo },
  { title: "Progress", Demo: ProgressDemo },
  { title: "Skeleton", Demo: SkeletonDemo },
  { title: "Avatar", Demo: AvatarDemo },
  { title: "Text", Demo: TextDemo },
];

export function ComponentsScreen() {
  const styles = useStyles();
  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.gallery}>
      {GALLERY.map(({ title, Demo }) => (
        <View key={title} style={styles.section}>
          <Text variant="label" color="mutedForeground">
            {title}
          </Text>
          <Demo />
        </View>
      ))}
    </ScrollView>
  );
}

/** sign-in-01 (decision #28): real validation; submitting does nothing in the preview. */
export function SignInScreen() {
  return <SignIn01 />;
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  gallery: { gap: t.spacing[8], padding: t.spacing[5], paddingBottom: t.spacing[10] },
  section: { gap: t.spacing[3] },
}));
