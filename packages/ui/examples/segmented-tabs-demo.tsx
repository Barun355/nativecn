import { Bell, User } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import {
  SegmentedTabs,
  SegmentedTabsContent,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/registry/components/segmented-tabs";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({ root: { gap: t.spacing[8] } }));

export default function SegmentedTabsDemo() {
  const styles = useStyles();
  const [period, setPeriod] = useState("week");
  return (
    <View style={styles.root}>
      {/* Uncontrolled, segmented (the default Variant), with icons. */}
      <SegmentedTabs defaultValue="account">
        <SegmentedTabsList>
          <SegmentedTabsTrigger value="account" label="Account" icon={User} />
          <SegmentedTabsTrigger value="notifications" label="Notifications" icon={Bell} />
        </SegmentedTabsList>
        <SegmentedTabsContent value="account">
          <Text>Your name, email and password.</Text>
        </SegmentedTabsContent>
        <SegmentedTabsContent value="notifications">
          <Text>Choose what we send you.</Text>
        </SegmentedTabsContent>
      </SegmentedTabs>

      {/* Controlled, underline. */}
      <SegmentedTabs value={period} onValueChange={setPeriod} variant="underline">
        <SegmentedTabsList>
          <SegmentedTabsTrigger value="day" label="Day" />
          <SegmentedTabsTrigger value="week" label="Week" />
          <SegmentedTabsTrigger value="month" label="Month" />
        </SegmentedTabsList>
        <SegmentedTabsContent value="day">
          <Text>Activity today.</Text>
        </SegmentedTabsContent>
        <SegmentedTabsContent value="week">
          <Text>Activity this week.</Text>
        </SegmentedTabsContent>
        <SegmentedTabsContent value="month">
          <Text>Activity this month.</Text>
        </SegmentedTabsContent>
      </SegmentedTabs>
    </View>
  );
}
