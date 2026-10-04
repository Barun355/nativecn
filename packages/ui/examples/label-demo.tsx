import { View } from "react-native";

import { Label } from "@/registry/components/label";

export function LabelDemo() {
  return (
    <View>
      <Label>Display name</Label>
      <Label required>Email</Label>
    </View>
  );
}
