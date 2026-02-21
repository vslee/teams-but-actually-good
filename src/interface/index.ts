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
}
