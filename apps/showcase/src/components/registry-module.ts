import { useEffect, useState, type ComponentType } from "react";

import { registryIndex } from "@/registry-index";

type Module = Record<string, unknown>;
type AnyComponent = ComponentType<Record<string, unknown>>;

const cache = new Map<string, Promise<Module>>();

/** Load a Registry Item's source (once; later calls reuse it). */
function loadRegistryModule(name: string): Promise<Module> {
  let loading = cache.get(name);
  if (!loading) {
    const entry = registryIndex[name];
    loading = entry ? entry.load() : Promise.reject(new Error(`No Registry Item "${name}"`));
    cache.set(name, loading);
  }
  return loading;
}

/** The component a module exports: `exportName`, else its default export, else its first one. */
function componentOf(module: Module, exportName?: string): AnyComponent | undefined {
  const pick = exportName
    ? module[exportName]
    : (module.default ?? Object.values(module).find((v) => typeof v === "function"));
  return typeof pick === "function" ? (pick as AnyComponent) : undefined;
}

/**
 * A component from a Registry Item's source, loaded on demand: `exportName`, else the module's
 * default (or only) export. `Component` is undefined until it has loaded.
 */
export function useRegistryComponent(name: string | undefined, exportName?: string) {
  const [loaded, setLoaded] = useState<{
    key: string;
    Component?: AnyComponent;
    error?: Error;
  }>();
  const key = `${name}#${exportName ?? ""}`;

  useEffect(() => {
    if (!name) return;
    let active = true;
    loadRegistryModule(name)
      .then((module) => {
        const Component = componentOf(module, exportName);
        if (!Component) throw new Error(`"${name}" exports no component ${exportName ?? ""}`);
        if (active) setLoaded({ key, Component });
      })
      .catch((error: Error) => {
        if (active) setLoaded({ key, error });
      });
    return () => {
      active = false;
    };
  }, [name, exportName, key]);

  const current = loaded?.key === key ? loaded : undefined;
  return { Component: current?.Component, error: current?.error };
}
