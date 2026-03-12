/**
 * TypeScript declaration for SVG imports
 * When using esbuild with --loader:.svg=dataurl,
 * SVG files are imported as base64 data URL strings
 */
declare module "*.svg" {
  const content: string;
  export default content;
}
