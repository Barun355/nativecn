import { router, type Href } from "expo-router";
import {
  LayoutPanelLeft,
  PanelBottom,
  PanelLeft,
  Rocket,
  Rows3,
  SquareUser,
  type LucideIcon,
} from "lucide-react-native";

import { TabScreen } from "@/components/tab-screen";
import { blockGroups, LAYOUT_EXAMPLES, showcaseHref, type CatalogItem } from "@/catalog";
import { registryIndex } from "@/registry-index";
import {
  ListItem,
  ListSection,
  ListSectionFooter,
  ListSectionHeader,
} from "@/registry/components/list";

const { screens, drawers } = blockGroups(registryIndex);

/** Navigation and the Starter, running in context (not Registry Blocks of their own). */
const IN_CONTEXT: { title: string; description: string; icon: LucideIcon; href?: Href }[] = [
  {
    title: "TabNavigation, classic",
    description: "This app's own tab bar, below.",
    icon: PanelBottom,
  },
  {
    title: "TabNavigation, floating",
    description: "A tabs Layout with the floating pill, and SegmentedTabs inside each tab.",
    icon: Rows3,
    href: LAYOUT_EXAMPLES["tab-navigation-demo"] as Href,
  },
  {
    title: "Drawer Components",
    description: "The Drawer Component's example Layout.",
    icon: LayoutPanelLeft,
    href: LAYOUT_EXAMPLES["drawer-demo"] as Href,
  },
  {
    title: "Starter promo Screen",
    description: "The Screen every new nativecn app starts with, showing your Preset.",
    icon: Rocket,
    href: "/starter",
  },
];

// Blocks tab (decision #29): every Block running for real. Sign-in and sign-up validate for real
// and submit to a fake server with Toast feedback; drawers open in a real expo-router/drawer
// Layout; navigation and the Starter run in context. The lists come from the Registry index.
export default function BlocksScreen() {
  return (
    <TabScreen
      title="Blocks"
      description="Whole Screens and navigation, running for real. Install any with nativecn-cli add."
    >
      <ListSection>
        <ListSectionHeader>Sign in and sign up</ListSectionHeader>
        {screens.map((block) => (
          <BlockRow key={block.name} block={block} icon={SquareUser} />
        ))}
        <ListSectionFooter>
          Real validation, fake server. An email containing &quot;error&quot;, or the code 000000,
          shows the error Toast.
        </ListSectionFooter>
      </ListSection>

      <ListSection>
        <ListSectionHeader>Drawers</ListSectionHeader>
        {drawers.map((block) => (
          <BlockRow key={block.name} block={block} icon={PanelLeft} />
        ))}
        <ListSectionFooter>
          Each opens in a real expo-router/drawer Layout, where its items navigate. Home leads back
          to the Showcase.
        </ListSectionFooter>
      </ListSection>

      <ListSection>
        <ListSectionHeader>In context</ListSectionHeader>
        {IN_CONTEXT.map(({ title, description, icon, href }) => (
          <ListItem
            key={title}
            title={title}
            description={description}
            icon={icon}
            chevron={href != null}
            onPress={href ? () => router.push(href) : undefined}
          />
        ))}
      </ListSection>
    </TabScreen>
  );
}

function BlockRow({ block, icon }: { block: CatalogItem; icon: LucideIcon }) {
  return (
    <ListItem
      title={`${block.name}: ${block.title}`}
      description={block.description}
      icon={icon}
      chevron
      onPress={() => router.push(showcaseHref(registryIndex, block.name) as Href)}
    />
  );
}
