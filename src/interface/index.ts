import { AnyModuleFactory } from "../types/modules";
import { Author, SettingsDefinition } from "../types/types";

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
  plugin?: string;
}

export interface Plugin {
  name: string;
  description?: string;
  enableByDefault?: boolean;
  enable?: boolean;
  /** Schema: types, descriptions, options — used by the UI to render controls */
  settingsDef?: SettingsDefinition;
  /** Current runtime values — populated by plugin-loader from storage or defaults */
  settings?: Record<string, unknown>;
  author?: Author | Author[];
  patches: Patch[];
  mainEntry?: () => void;
  onChangeObserved?: () => void;
}

export interface Styles {
  [key: string]: string;
}

export interface Theme {
  name: string;
  description: string;
  author: string;
  version: string;
  source?: string;
  website?: string;
  css: string;
  enable?: boolean;
}

// Global plugin registry
export const pluginRegistry: Record<string, Plugin> = {};

export function registerPlugin(plugin: Plugin) {
  pluginRegistry[plugin.name] = plugin;

  // Add plugin name to each patch for reference
  plugin.patches.forEach((patch) => {
    patch.plugin = plugin.name;
  });

  // Make plugin accessible globally for patched code
  window.__TEAMS_PLUGINS__ = window.__TEAMS_PLUGINS__ || {};
  window.__TEAMS_PLUGINS__[plugin.name] = plugin;
}

export const themeRegistry: Record<string, Theme> = {};

export function registerTheme(theme: Theme) {
  themeRegistry[theme.name] = theme;
}
