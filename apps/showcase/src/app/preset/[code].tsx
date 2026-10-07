import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import { describePreset, presetFromParam } from "@/preset/preset";
import { setPreset } from "@/preset/store";
import { toast } from "@/registry/components/toast";

// `nativecn://preset/<code>` (the Preset builder's QR, decision #28): apply the Preset live and
// open the Theme tab. A code that doesn't decode leaves the Preset as it was.
export default function PresetLink() {
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    const preset = presetFromParam(code);
    if (preset) {
      setPreset(preset);
      toast.success("Preset applied", { description: describePreset(preset) });
    } else {
      toast.error("That Preset code isn't valid", { description: String(code ?? "") });
    }
    // Back to the tabs underneath (unstable_settings in the root Layout keeps them there).
    router.dismissTo("/theme");
  }, [code]);

  return null;
}
