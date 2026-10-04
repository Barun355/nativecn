import { Mail } from "lucide-react-native";
import { View } from "react-native";

import { Input } from "@/registry/components/input";

export function InputDemo() {
  return (
    <View>
      <Input icon={Mail} placeholder="Email" aria-label="Email" keyboardType="email-address" />
      <Input size="sm" placeholder="Small" aria-label="Small" />
      <Input size="lg" placeholder="Large" aria-label="Large" />
      <Input status="error" defaultValue="not-an-email" aria-label="Email" />
      <Input secureTextEntry placeholder="Password" aria-label="Password" />
      <Input disabled defaultValue="Read only" aria-label="Disabled" />
    </View>
  );
}
