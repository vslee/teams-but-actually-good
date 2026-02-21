// JSX type declarations for TypeScript
// We use @types/react for proper intellisense even though we use Teams' bundled React

/// <reference types="react" />

// This makes JSX work with Teams' bundled React while giving us full type support
declare global {
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
