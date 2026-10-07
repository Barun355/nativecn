import { useGlobalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useMemo, useState } from "react";

import { demoHandlers } from "@/components/demo-handlers";
import { useRegistryComponent } from "@/components/registry-module";
import { blockGroups } from "@/catalog";
import { registryIndex } from "@/registry-index";

const DEFAULT_PANEL = blockGroups(registryIndex).drawers[0]?.name ?? "drawer-demo";

/** The panel named by a `/drawers/<panel>` path, if this is one. */
function panelFromPath(path: string | string[] | undefined): string | undefined {
  const [first, second] = [path].flat();
  return first === "drawers" && second && registryIndex[second] ? second : undefined;
}

/**
 * A real `expo-router/drawer` Layout for the drawer Blocks (and the Drawer Component's example).
 * `/drawers/<panel>` opens it with that panel; its catch-all route then answers every path the
 * panel's items link to (/inbox, /settings…), so tapping them navigates inside the drawer as in
 * an app. "Home" (/) leads back to the Showcase.
 */
export default function DrawerLayout() {
  const { path } = useGlobalSearchParams<{ path?: string | string[] }>();
  const opened = panelFromPath(path);
  // The panel stays while its items navigate to other paths.
  const [panel, setPanel] = useState(opened ?? DEFAULT_PANEL);
  if (opened && opened !== panel) setPanel(opened);

  const entry = registryIndex[panel]!;
  // A Block exports its panel; the Drawer example is a whole drawer Layout (its default export).
  const { Component } = useRegistryComponent(panel, entry.component);
  const handlers = useMemo(() => demoHandlers(entry.callbacks ?? []), [entry]);

  if (!Component) return null;
  if (!entry.component) return <Component key={panel} />;
  return (
    <Drawer
      key={panel}
      defaultStatus="open"
      drawerContent={(props) => <Component {...props} {...handlers} />}
    />
  );
}
