import easyLogger from "./easy-logger";
import { initialize, connectToDevTools } from "react-devtools-core";

console.log("[Custom Teams] Booting up native React DevTools connection...");

try {
  // 1. MUST be called first to create the global hook before Teams loads React
  initialize({});

  // 2. We create our own WebSocket to ensure it fires properly
  const ws = new window.WebSocket("ws://localhost:8097");

  ws.onopen = () => {
    console.log("[Custom Teams] WebSocket connected to Standalone App!");
  };

  ws.onerror = (err) => {
    console.error("[Custom Teams] WebSocket Error (Check Mixed Content):", err);
  };

  // 3. Pass the custom WebSocket directly to the DevTools connector
  connectToDevTools({
    websocket: ws,
  });
} catch (e) {
  console.error("[Custom Teams] DevTools failed to initialize:", e);
}

/*const WEBPACK_CHUNK_NAME = "webpackChunk_msteams_react_web_client";

console.log("[Custom Teams] Initializing Webpack Interceptor...");

// 2. We set a trap on the window object. If Teams tries to create the array, we catch it.
let originalChunkArray = (window as any)[WEBPACK_CHUNK_NAME] || [];

Object.defineProperty(window, WEBPACK_CHUNK_NAME, {
  get: () => originalChunkArray,
  set: (newArray) => {
    originalChunkArray = newArray;
    hijackWebpackPush(originalChunkArray);
  },
});

// If the array already existed somehow, hijack it immediately
if (originalChunkArray.length > 0) {
  hijackWebpackPush(originalChunkArray);
}

// 3. The actual Hijacker Engine
function hijackWebpackPush(chunkArray: any) {
  // Save the original push function so we can call it later
  const originalPush = chunkArray.push.bind(chunkArray);

  // Override the push function
  chunkArray.push = function (...args: any[]) {
    const chunk = args[0];

    // In Webpack 5, chunks look like: [ [chunkIds], { moduleId: function(module, exports, require) {...} } ]
    const modules = chunk[1];

    // Loop through every module (React component/function) Teams is trying to load
    for (const moduleId in modules) {
      let moduleFuncStr = modules[moduleId].toString();

      // 1. Check for your unbreakable Anchor
      if (
        moduleFuncStr.includes(
          "To pick up a draggable item, press the space bar.",
        )
      ) {
        console.log(`[Patcher] Found the Drag & Drop module! ID: ${moduleId}`);
        console.log(moduleFuncStr);

        // 2. The Regex Pattern
        // Group 1: Matches "function F(le) {" (and captures it)
        // Group 2: Captures JUST the props variable name (e.g., "le")
        // Group 3: Matches the destructuring block "let { children: q, id: te, items: ie,"
        const patchRegex = /(let\s*\{[^}]*?id:\s*\w+,\s*items:\s*\w+,)/;

        if (patchRegex.test(moduleFuncStr)) {
          moduleFuncStr = moduleFuncStr.replace(
            patchRegex,
            `arguments[0].items = (arguments[0].items && Array.isArray(arguments[0].items)) ? arguments[0].items.slice(-1) : []; $1`,
          );

          modules[moduleId] = (0, eval)(`(${moduleFuncStr})`);
          console.log(
            `[Patcher] SUCCESS! Minimal regex worked. Array truncated.`,
          );
        } else {
          console.warn(`[Patcher] Anchor found, but minimal regex failed.`);
        }
      }
    }

    // Let Webpack continue loading the chunk with our modified code inside
    return originalPush(...args);
  };
}*/

window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hostname.includes("teams.microsoft.com")) {
    easyLogger(`Skipping injection on ${window.location.hostname}`);
    return;
  }

  easyLogger("TypeScript Injection Successful!");
});
