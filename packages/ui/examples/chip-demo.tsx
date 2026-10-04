import { Star } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { Chip, ChipGroup } from "@/registry/components/chip";
import { createStyles } from "@/registry/theme";

const useStyles = createStyles((t) => ({
  root: { gap: t.spacing[6] },
  row: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing[2] },
}));

export default function ChipDemo() {
  const styles = useStyles();
  const [sort, setSort] = useState("new");
  const [tags, setTags] = useState(["react-native", "expo", "design"]);

  return (
    <View style={styles.root}>
      <ChipGroup value={sort} onValueChange={setSort}>
        <Chip value="new" label="Newest" />
        <Chip value="top" label="Top rated" />
        <Chip value="near" label="Nearby" />
      </ChipGroup>
      <ChipGroup type="multiple" defaultValue={["vegan"]}>
        <Chip value="vegan" label="Vegan" />
        <Chip value="gluten-free" label="Gluten-free" />
        <Chip value="spicy" label="Spicy" disabled />
      </ChipGroup>
      <Chip label="Favourites" icon={Star} defaultSelected />
      <View style={styles.row}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
          />
        ))}
      </View>
    </View>
  );
}
