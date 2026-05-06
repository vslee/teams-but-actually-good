export interface WebpackModule {
  id: PropertyKey;
  exports: Record<string, unknown>;
  [key: string]: unknown;
}

export type AnyModuleFactory = (
  module: WebpackModule,
  exports: Record<string, unknown>,
  require: unknown,
) => void;
