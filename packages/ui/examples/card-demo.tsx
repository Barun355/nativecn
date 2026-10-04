import { View } from "react-native";

import { Badge } from "@/registry/components/badge";
import { Button } from "@/registry/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/components/card";
import { Text } from "@/registry/components/text";
import { createStyles } from "@/registry/theme";

export default function CardDemo() {
  const styles = useStyles();
  return (
    <View style={styles.stack}>
      <Card>
        <CardHeader>
          <CardTitle>Pro plan</CardTitle>
          <CardDescription>Everything in Free, plus unlimited projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge label="Most popular" variant="secondary" />
          <Text>$12 per month, billed yearly.</Text>
        </CardContent>
        <CardFooter>
          <Button label="Upgrade" style={styles.grow} />
        </CardFooter>
      </Card>

      {/* With onPress the whole card is one pressable target. */}
      <Card onPress={() => {}}>
        <CardHeader>
          <CardTitle>Order #1042</CardTitle>
          <CardDescription>Arrives Thursday</CardDescription>
        </CardHeader>
      </Card>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  stack: { gap: t.spacing[4] },
  grow: { flex: 1 },
}));
