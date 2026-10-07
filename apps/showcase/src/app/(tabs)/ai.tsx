import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import {
  BookOpen,
  Bot,
  Code,
  FileText,
  GitBranch,
  Globe,
  ScanEye,
  ScrollText,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react-native";
import { Linking } from "react-native";

import { Padded, TabScreen } from "@/components/tab-screen";
import { encodePreset, promptForAi } from "@/preset/preset";
import { usePresetStore } from "@/preset/store";
import { Button } from "@/registry/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/components/card";
import {
  ListItem,
  ListSection,
  ListSectionFooter,
  ListSectionHeader,
} from "@/registry/components/list";
import { Text } from "@/registry/components/text";
import { toast } from "@/registry/components/toast";

/** The five Skills (decision #20), installed into .agents/skills by create/init. */
const SKILLS = [
  ["nativecn-setup", "Start an app or add nativecn: Preset, flags, agents."],
  ["nativecn-build-screen", "Build a Screen from Blocks and Components, wired into routes."],
  ["nativecn-theme", "Change colours, fonts, radius or dark mode through the Theme."],
  ["nativecn-component-authoring", "Write Components that keep the Component contract."],
  [
    "nativecn-visual-qa",
    "Screenshot the running app, judge it, fix small issues, report the rest.",
  ],
] as const;

/** The nativecn MCP server's read-only tools (decision #19; packages/cli/src/mcp/server.ts). */
const MCP_TOOLS = [
  "list_items",
  "search_items",
  "view_items",
  "get_item_examples",
  "get_add_command",
  "get_project_config",
  "get_audit_checklist",
  "list_block_variants",
  "list_preset_options",
  "build_preset_code",
];

/** A few of the 12 Rules in AGENTS.md, in brief. */
const RULES = [
  "Tokens only, through createStyles: no hard-coded colours or sizes, no Tailwind.",
  "All text is Text, every glyph is Icon, every Screen is wrapped in Container.",
  "Feedback is toast() and Alert, never a platform alert.",
  "Forms use react-hook-form and zod through FormField, inside a FocusChain.",
  "The Preset is fixed: never switch Style in an app.",
];

const LINKS = [
  { title: "nativecn.dev", url: "https://nativecn.dev", icon: Globe },
  { title: "Docs", url: "https://nativecn.dev/docs", icon: BookOpen },
  { title: "GitHub", url: "https://github.com/Barun355/nativecn", icon: GitBranch },
  { title: "Privacy policy", url: "https://nativecn.dev/privacy", icon: Shield },
];

const open = (url: string) => () => {
  Linking.openURL(url).catch(() => {});
};

// Built for AI tab (decision #29): the AI-native features (Rules, Skills, the MCP tools, Preset
// codes for agents) and the Visual QA Loop walkthrough, then the version, links, privacy and
// open-source licences.
export default function BuiltForAiScreen() {
  const preset = usePresetStore((s) => s.preset);
  const code = encodePreset(preset);

  const copyForAi = () => {
    Clipboard.setStringAsync(promptForAi(preset)).then(
      () => toast.success("Copied for your AI agent", { description: `Preset ${code}` }),
      () => toast.error("Couldn't copy the instruction"),
    );
  };

  return (
    <TabScreen
      title="Built for AI"
      description="nativecn teaches AI agents to build whole Expo apps with it, then check them on a real device."
    >
      <ListSection>
        <ListSectionHeader>The Visual QA Loop</ListSectionHeader>
        <ListItem
          title="See it fix a screen"
          description="A misaligned screen, the agent's report, and the fixed screen."
          icon={ScanEye}
          chevron
          onPress={() => router.push("/visual-qa")}
        />
      </ListSection>

      <ListSection>
        <ListSectionHeader>Rules</ListSectionHeader>
        {RULES.map((rule) => (
          <ListItem key={rule} title={rule} icon={ScrollText} />
        ))}
        <ListSectionFooter>
          AGENTS.md carries 12 non-negotiable Rules that every agent follows in your app.
        </ListSectionFooter>
      </ListSection>

      <ListSection>
        <ListSectionHeader>Skills</ListSectionHeader>
        {SKILLS.map(([name, use]) => (
          <ListItem key={name} title={name} description={use} icon={Sparkles} />
        ))}
        <ListSectionFooter>
          Installed for Claude Code, Codex, Cursor and Antigravity by create and init.
        </ListSectionFooter>
      </ListSection>

      <ListSection>
        <ListSectionHeader>MCP tools</ListSectionHeader>
        <ListItem
          title={MCP_TOOLS.join(", ")}
          description="Read-only: agents look up items, props, examples and add commands instead of guessing."
          icon={Wrench}
        />
        <ListSectionFooter>
          Run locally with npx nativecn-cli mcp, or at nativecn.dev/mcp.
        </ListSectionFooter>
      </ListSection>

      <Padded>
        <Card>
          <CardHeader>
            <CardTitle>Preset codes for agents</CardTitle>
            <CardDescription>
              Your Preset is {code}. Agents read codes with list_preset_options and build them with
              build_preset_code; give yours to an agent and it creates the app in this look.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button label="Copy for AI" icon={Bot} variant="secondary" onPress={copyForAi} />
          </CardContent>
        </Card>
      </Padded>

      <ListSection>
        <ListSectionHeader>About</ListSectionHeader>
        <ListItem title="Version" icon={Code} trailing={Constants.expoConfig?.version ?? "0.1.0"} />
        {LINKS.map(({ title, url, icon }) => (
          <ListItem key={title} title={title} icon={icon} chevron onPress={open(url)} />
        ))}
        <ListItem
          title="Open-source licences"
          icon={FileText}
          chevron
          onPress={() => router.push("/licenses")}
        />
        <ListSectionFooter>
          No data collected: no accounts, analytics or network requests. Only your Scheme and Preset
          are kept, on this device.
        </ListSectionFooter>
      </ListSection>

      <Padded>
        <Text variant="caption" color="mutedForeground" align="center">
          nativecn is MIT licensed. Made for Expo.
        </Text>
      </Padded>
    </TabScreen>
  );
}
