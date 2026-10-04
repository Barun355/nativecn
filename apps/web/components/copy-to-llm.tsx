"use client";

import { CopyButton } from "@/components/copy-button";
import { itemBundle } from "@/lib/llm-bundle";

import { findExamples } from "../../../packages/cli/src/mcp/catalog.ts";
import type { RegistryIndex, RegistryItem } from "../../../packages/cli/src/registry.ts";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

/** Fetches the item and its examples from this site's Registry and builds the bundle. */
async function buildBundle(name: string, style: string): Promise<string> {
  const base = `/r/styles/${style}`;
  const [item, index] = await Promise.all([
    getJson<RegistryItem>(`${base}/${name}.json`),
    getJson<RegistryIndex>(`${base}/registry.json`),
  ]);
  const names = findExamples(index.items ?? [], name)
    .filter((n) => n !== name)
    .slice(0, 5);
  const examples = await Promise.all(names.map((n) => getJson<RegistryItem>(`${base}/${n}.json`)));
  return itemBundle({ item, examples, style });
}

/**
 * "Copy to LLM" for Component and Block pages: copies the item's description, add command,
 * props, usage examples and source as one prompt-ready block.
 */
export function CopyToLlm({ item, style = "vega" }: { item: string; style?: string }) {
  return (
    <CopyButton
      label="Copy to LLM"
      title={`Copy ${item}'s description, add command, props, examples and source`}
      produce={() => buildBundle(item, style)}
    />
  );
}
