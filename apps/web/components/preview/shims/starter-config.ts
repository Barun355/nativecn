// The app's components.json as the Starter's promo Screen sees it in the preview (#163). In an
// app, the Your Preset card reads the Preset `create` wrote there; in the preview it is the
// phone's Preset, so the card follows the builder live. next.config.ts points the Starter
// Screen's `../../components.json` here; nothing else uses it.

import { use } from "react";

import { starterConfig } from "@/lib/starter-preview";

import { PreviewPresetContext } from "../preset-context";

const config = {
  /**
   * The Screen reads this only while it renders (`const { preset } = config` in its body), so
   * `use` reads the phone's Preset from context: nothing is stored in this module, and every
   * Preset gives new objects (#156). `use`, unlike other Hooks, may be called anywhere during a
   * render; the lint rule cannot see that this getter only runs there.
   */
  get preset() {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- read only during the Screen's render
    const preset = use(PreviewPresetContext);
    if (!preset) throw new Error("The Starter Screen renders only inside the preview's phone.");
    return starterConfig(preset).preset;
  },
};

export default config;
