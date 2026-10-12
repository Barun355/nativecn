// The Preset the preview's phone is showing, for a ThemeProvider nested inside it (see
// shims/registry-theme). Null outside the preview.

import { createContext } from "react";
import type { Preset } from "preset";

export const PreviewPresetContext = createContext<Preset | null>(null);
