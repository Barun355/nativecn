import type { Metadata } from "next";

import { PresetBuilder } from "@/components/preset-builder";
import { presetFromSearch } from "@/lib/preset-builder";
import { previewFontFaces } from "@/lib/preview-fonts";

export const metadata: Metadata = {
  title: "Create",
  description:
    "Build a nativecn Preset: pick a Style, colours, radius and fonts, preview them live, and copy the code and the create command.",
};

/** The Preset builder (issue #80, decision #28): nativecn.dev/create?preset=<code>. */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string | string[] }>;
}) {
  const { preset: code } = await searchParams;
  const { preset, invalid } = presetFromSearch(code);
  return (
    <main id="main" className="mx-auto max-w-screen-2xl px-4 py-8 md:px-6">
      {/* The Preset fonts, for the preview and the spec card (each face loads only when used). */}
      <style>{previewFontFaces()}</style>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create a Preset</h1>
        <p className="max-w-2xl text-muted-foreground">
          Pick a Style, colours, radius and fonts. The preview shows nativecn&apos;s own Components
          with your Preset; the link in the address bar and the code below share it.
        </p>
      </div>
      <PresetBuilder
        initialPreset={preset}
        invalidCode={invalid ? (Array.isArray(code) ? code[0] : code) : undefined}
      />
    </main>
  );
}
