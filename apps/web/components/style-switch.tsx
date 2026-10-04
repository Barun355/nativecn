"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { CopyToLlm } from "@/components/copy-to-llm";

// Every Registry item is built once per Style (Vega, Nova), with the Style's values baked into
// the source. On an item page the reader picks which Style's code to read; the Style a project
// gets is chosen once, by its Preset, when it is created.
const StyleContext = createContext<{
  style: string;
  styles: string[];
  setStyle: (style: string) => void;
}>({ style: "vega", styles: ["vega"], setStyle: () => {} });

const label = (style: string) => style.charAt(0).toUpperCase() + style.slice(1);

export function StyleProvider({ styles, children }: { styles: string[]; children: ReactNode }) {
  const [style, setStyle] = useState(styles[0] ?? "vega");
  return (
    <StyleContext.Provider value={{ style, styles, setStyle }}>{children}</StyleContext.Provider>
  );
}

/** The Style picker: which Style's code the page shows. */
export function StyleSwitch() {
  const { style, styles, setStyle } = useContext(StyleContext);
  if (styles.length < 2) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Style</span>
      <div role="group" aria-label="Style" className="inline-flex rounded-md border p-0.5">
        {styles.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === style}
            onClick={() => setStyle(s)}
            className={`rounded px-2.5 py-1 font-medium ${
              s === style
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label(s)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Content for one Style; the others stay in the HTML (for search engines and no-JS) but hidden. */
export function ForStyle({ style, children }: { style: string; children: ReactNode }) {
  const current = useContext(StyleContext).style;
  return <div hidden={style !== current}>{children}</div>;
}

/** The name of the Style being shown, for captions. */
export function CurrentStyle() {
  return <>{label(useContext(StyleContext).style)}</>;
}

/** "Copy to LLM" for the Style being shown. */
export function StyledCopyToLlm({ item }: { item: string }) {
  return <CopyToLlm item={item} style={useContext(StyleContext).style} />;
}
