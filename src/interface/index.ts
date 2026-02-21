import { AnyModuleFactory } from "../types/modules";

export const SYM_IS_PROXIED_FACTORY = Symbol("TeamsPatcher.isProxiedFactory");
export const SYM_ORIGINAL_FACTORY = Symbol("TeamsPatcher.originalFactory");

export interface PatchedModuleFactory extends AnyModuleFactory {
  [SYM_ORIGINAL_FACTORY]: any;
  [SYM_IS_PROXIED_FACTORY]: boolean;
}

export interface WebpackRequire {
  (moduleId: string | number): any;
  m: Record<PropertyKey, AnyModuleFactory>;
  c: Record<PropertyKey, any>;
  p?: string;
  d?: (exports: any, definition: any) => void;
}

export interface PatchReplacement {
  match: string | RegExp;
  replace: string;
}

export interface Patch {
  find: string | RegExp;
  replacement: PatchReplacement | PatchReplacement[];
}

export interface Plugin {
  name: string;
  description?: string;
  patches: Patch[];
  [key: string]: any;
}

// Global plugin registry
export const pluginRegistry: Record<string, Plugin> = {};

export function registerPlugin(plugin: Plugin) {
  pluginRegistry[plugin.name] = plugin;

  // Add plugin name to each patch for reference
  plugin.patches.forEach((patch) => {
    (patch as any).plugin = plugin.name;
  });

  // Make plugin accessible globally for patched code
  (window as any).__TEAMS_PLUGINS__ = (window as any).__TEAMS_PLUGINS__ || {};
  (window as any).__TEAMS_PLUGINS__[plugin.name] = plugin;
}
