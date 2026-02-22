/**
 * TypeScript declaration for CSS imports
 * When using esbuild with --loader:.css=text,
 * CSS files are imported as strings
 */
declare module "*.css" {
  const content: string;
  export default content;
}
