"use client";

// The docs pages' live preview renderer (#162): one item's usage examples, or one Screen Block,
// in the phone, themed by the visitor's Preset. Loaded lazily, only in the browser (see
// docs-preview); each item's own code is a further lazy chunk (docs-demos).

import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import { ScrollView, View } from "react-native";
import type { Preset } from "preset";

import type { PreviewBlock, PreviewExample } from "@/lib/docs-preview";
import { createStyles } from "@/registry/theme";

import { BLOCK_LOADERS, EXAMPLE_LOADERS } from "./docs-demos";
import { PreviewRoot } from "./preview-root";
import type { PreviewScheme } from "./theme";

export type DocsPhoneProps = {
  preset: Preset;
  scheme: PreviewScheme;
  onSchemeChange?: (scheme: PreviewScheme) => void;
  /** What to run: a Component's usage examples, or a Screen Block. */
  show: { examples: PreviewExample[] } | { block: PreviewBlock };
  /** Shown while the item's code loads (the spec card). */
  fallback: ReactNode;
};

/** Examples that are a whole Screen (Container fills the phone), rather than a sample in a list. */
const FULL_SCREEN: ReadonlySet<PreviewExample> = new Set(["container-demo"]);

// One lazy component per name, made once: nothing loads until a page renders it.
const lazyAll = <K extends string>(loaders: Record<K, () => Promise<{ default: ComponentType }>>) =>
  Object.fromEntries(
    Object.entries(loaders).map(([name, load]) => [name, lazy(load as never)]),
  ) as Record<K, LazyExoticComponent<ComponentType>>;
const EXAMPLES = lazyAll(EXAMPLE_LOADERS);
const BLOCKS = lazyAll(BLOCK_LOADERS);

export default function DocsPhone({
  preset,
  scheme,
  onSchemeChange,
  show,
  fallback,
}: DocsPhoneProps) {
  return (
    <Suspense fallback={fallback}>
      <PreviewRoot preset={preset} scheme={scheme} onSchemeChange={onSchemeChange}>
        {"block" in show ? (
          <BlockScreen block={show.block} />
        ) : (
          <ExamplesScreen examples={show.examples} />
        )}
      </PreviewRoot>
    </Suspense>
  );
}

function BlockScreen({ block }: { block: PreviewBlock }) {
  const Block = BLOCKS[block];
  return <Block />;
}

function ExamplesScreen({ examples }: { examples: PreviewExample[] }) {
  const styles = useStyles();
  if (examples.length === 1 && FULL_SCREEN.has(examples[0]!)) {
    const Demo = EXAMPLES[examples[0]!];
    return <Demo />;
  }
  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
      {examples.map((name) => {
        const Demo = EXAMPLES[name];
        return (
          <View key={name} style={styles.example}>
            <Demo />
          </View>
        );
      })}
    </ScrollView>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: t.spacing[8],
    padding: t.spacing[5],
    paddingVertical: t.spacing[10],
  },
  example: { gap: t.spacing[3] },
}));
