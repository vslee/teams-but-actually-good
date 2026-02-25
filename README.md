# Teams But Good

A browser extension (and optional Tauri desktop wrapper) that patches Microsoft Teams at runtime to improve the user experience.

---

## How it works

### 1. Entry point — the content script

`extension/injection.js` (compiled from `src/injection.ts`) is injected into every `teams.microsoft.com` page at `document_start` in the **MAIN** world, meaning it shares the same JavaScript context as Teams itself.

### 2. Webpack interception

Teams is a React/Webpack app. The injection script hooks `Function.prototype.m`, a property that Webpack sets on every module registry object. This lets the patcher intercept **all** Webpack instances before any module factory runs.

For each detected Webpack instance the patcher:

- Wraps every module factory in a `Proxy`.
- On the first call to a factory, it runs all registered patches against that module's source code (string find/replace via regex).
- The patched source is re-evaluated with `eval()` and replaces the original factory.

### 3. CSP / Trusted Types bypass

Teams enforces a strict Content Security Policy with Trusted Types, which normally blocks `eval()`. The injection script works around this by stealing Microsoft's own privileged Trusted Types policy (`@msteams/frameworks-loader#load-build-chunk`) from the whitelist before Teams can claim it, then re-using it to create trusted scripts.

### 4. Plugin system

Plugins live in `src/teams-plugin/`. Each plugin exports a `Plugin` object with:

- `name` — unique identifier.
- `description` — optional human-readable description.
- `patches` — one or more `{ find, replacement }` objects that describe a regex/string search and the replacement to apply to matching Webpack module sources.
- Any additional methods the patched code can call back into at runtime (the plugin object is exposed on `window.__TEAMS_PLUGINS__`).

The file `src/utils/plugin-registry.ts` is **auto-generated** by `scripts/generate-plugins.ts` and re-exports every plugin found under `src/teams-plugin/`. Running `bun run generate:plugins` regenerates it.

### 5. Build pipeline

```
bun run build
```

1. Regenerates `src/utils/plugin-registry.ts`.
2. Bundles `src/injection.ts` (with all plugins) into a single `dist/injection.js` using esbuild (CSS files are inlined as text).
3. Copies the result to `extension/injection.js` so the browser extension is ready to load.

### 6. Tauri wrapper (optional)

The `src-tauri/` directory contains a Tauri v2 app that can wrap the extension in a standalone desktop application. Run `bun run tauri:dev` to start it.

---

## Getting started

```bash
# Install dependencies
bun install

# Build the extension
bun run build

# Then load extension/ as an unpacked extension in Chrome/Edge

# Or start the Tauri dev app
bun run dev
```
