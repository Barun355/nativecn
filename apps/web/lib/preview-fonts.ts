// The Preset fonts for the builder's preview and spec card. Components pick a face by its
// PostScript name in `fontFamily` (never fontWeight), so each face is declared as its own family
// under that name, from the same files nativecn.dev serves to the CLI. A browser downloads a face
// only when something on the page uses it.

import { FONT_FACES, FONT_IDS, FONTS, fontFilePath } from "../../../packages/ui/presets/fonts.ts";

export function previewFontFaces(): string {
  return FONT_IDS.flatMap((id) =>
    FONT_FACES.map(
      (face) =>
        `@font-face{font-family:"${FONTS[id].faces[face]}";src:url("/${fontFilePath(id, face)}") format("truetype");font-display:swap}`,
    ),
  ).join("\n");
}
