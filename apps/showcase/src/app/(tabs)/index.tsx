import { router } from "expo-router";
import { SearchX, Sparkles } from "lucide-react-native";
import { useState } from "react";

import { Padded, TabScreen } from "@/components/tab-screen";
import { componentGroups, foundations, type CatalogItem } from "@/catalog";
import { registryIndex } from "@/registry-index";
import { EmptyState } from "@/registry/components/empty-state";
import {
  ListItem,
  ListSection,
  ListSectionFooter,
  ListSectionHeader,
} from "@/registry/components/list";
import { SearchField } from "@/registry/components/search-field";

const COMPONENT_COUNT = componentGroups(registryIndex).reduce((n, g) => n + g.items.length, 0);

// Components tab (decision #29): every Component, searchable and grouped, from the generated
// Registry index; each row opens a page with its live examples. The Feedback group starts with
// live demos of Toast, Alert, Skeleton, Progress, field errors and loading Buttons.
export default function ComponentsScreen() {
  const [query, setQuery] = useState("");
  const groups = componentGroups(registryIndex, query);
  const primitives = foundations(registryIndex, query);
  const searching = query.trim().length > 0;

  return (
    <TabScreen
      title="Components"
      description={`${COMPONENT_COUNT} Components, rendered from the nativecn source in your Preset.`}
    >
      <Padded>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search components"
          returnKeyType="search"
        />
      </Padded>

      {groups.map((group) => (
        <ListSection key={group.id}>
          <ListSectionHeader>{group.title}</ListSectionHeader>
          {group.id === "feedback" && !searching ? (
            <ListItem
              title="Feedback demos"
              description="Toast, Alert, Skeleton, Progress, field errors and loading Buttons, working together."
              icon={Sparkles}
              chevron
              onPress={() => router.push("/feedback")}
            />
          ) : null}
          {group.items.map((item) => (
            <ItemRow key={item.name} item={item} />
          ))}
        </ListSection>
      ))}

      {primitives.length ? (
        <ListSection>
          <ListSectionHeader>Primitives and Theme</ListSectionHeader>
          {primitives.map((item) => (
            <ItemRow key={item.name} item={item} />
          ))}
          <ListSectionFooter>
            The foundations Components are built on. They have no look of their own.
          </ListSectionFooter>
        </ListSection>
      ) : null}

      {groups.length === 0 && primitives.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          description={`Nothing matches "${query.trim()}". Try a name like Button or a group like Forms.`}
        />
      ) : null}
    </TabScreen>
  );
}

function ItemRow({ item }: { item: CatalogItem }) {
  return (
    <ListItem
      title={item.title}
      description={item.description}
      chevron
      onPress={() => router.push({ pathname: "/component/[name]", params: { name: item.name } })}
    />
  );
}
