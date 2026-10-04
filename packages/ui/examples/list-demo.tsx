import { Bell, LogOut, Moon, User } from "lucide-react-native";
import { View } from "react-native";

import { Badge } from "@/registry/components/badge";
import {
  ListItem,
  ListSection,
  ListSectionFooter,
  ListSectionHeader,
} from "@/registry/components/list";
import { createStyles } from "@/registry/theme";

export default function ListDemo() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <ListSection>
        <ListSectionHeader>Account</ListSectionHeader>
        <ListItem
          icon={User}
          title="Profile"
          description="Name, photo and email"
          chevron
          onPress={() => {}}
        />
        <ListItem
          icon={Bell}
          title="Notifications"
          trailing={<Badge label="3" />}
          chevron
          onPress={() => {}}
        />
        <ListItem icon={Moon} title="Appearance" trailing="System" chevron onPress={() => {}} />
        <ListSectionFooter>Changes sync across your devices.</ListSectionFooter>
      </ListSection>

      <ListSection>
        <ListItem icon={LogOut} title="Sign out" destructive onPress={() => {}} />
      </ListSection>
    </View>
  );
}

// In a FlashList, render ListItem as the row and Separator as ItemSeparatorComponent:
// <FlashList data={rows} renderItem={({ item }) => <ListItem title={item.name} chevron onPress={...} />} />

const useStyles = createStyles((t) => ({
  stack: { gap: t.spacing[6] },
}));
