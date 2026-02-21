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

export interface Patch {
  find: string | RegExp;
  replace: {
    match: string | RegExp;
    replace: string;
  }[];
  name?: string;
  plugin?: string;
}

export interface Plugin {
  name: string;
  patches: Patch[];
  [key: string]: any;
}

// Global plugin registry
export const pluginRegistry: Record<string, Plugin> = {};

export function registerPlugin(plugin: Plugin) {
  pluginRegistry[plugin.name] = plugin;
  // Make plugin accessible globally for patched code
  (window as any).__TEAMS_PLUGINS__ = (window as any).__TEAMS_PLUGINS__ || {};
  (window as any).__TEAMS_PLUGINS__[plugin.name] = plugin;
}
