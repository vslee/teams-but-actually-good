import { Plugin } from "../../interface";

const BLOCKED_URL_PATTERNS = [
  // Microsoft 1DS / Aria telemetry
  /aria\.microsoft\.com/,
  /pipe\.aria\.microsoft\.com/,
  // Application Insights / Azure Monitor
  /dc\.services\.visualstudio\.com/,
  /applicationinsights\.azure\.com/,
  /monitor\.azure\.com/,
  // Office / Teams diagnostics & analytics
  /diagnostics\.office\.com/,
  /events\.data\.microsoft\.com/,
  /collector\.azure\.com/,
  // Analytics JS chunks loaded from CDNs (script tag injection)
  /precompiled-telemetry-web/i,
  /boot-analytics-ping\.js/,
  /owa\.worker\.Analytics/i,
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function blockTelemetry() {
  // Patch fetch
  const originalFetch = window.fetch.bind(window);
  (window as any).fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) {
    const url = input instanceof Request ? input.url : String(input);
    if (isBlockedUrl(url)) {
      console.log(`[Telemetry Plugin] Blocked fetch request to: ${url}`);
      return Promise.resolve(new Response(null, { status: 200 }));
    }
    return originalFetch(input, init);
  };

  // Patch XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null,
  ) {
    if (isBlockedUrl(String(url))) {
      (this as any).__tbg_blocked = true;
    }
    return originalOpen.call(this, method, url, async, username, password);
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    if ((this as any).__tbg_blocked) {
      return;
    }
    return originalSend.call(this, body);
  };

  // Patch <script> tag creation to block analytics JS chunks
  const srcDescriptor =
    Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src") ??
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, "src");
  const originalCreateElement = document.createElement.bind(document);
  (document as any).createElement = function (
    tagName: string,
    options?: ElementCreationOptions,
  ) {
    const el = originalCreateElement(tagName, options);
    if (tagName.toLowerCase() === "script") {
      Object.defineProperty(el, "src", {
        set(value: string) {
          if (!isBlockedUrl(value)) {
            srcDescriptor?.set?.call(el, value);
          }
        },
        get() {
          return srcDescriptor?.get?.call(el) ?? "";
        },
        configurable: true,
      });
    }
    return el;
  };

  // MutationObserver: catch script tags appended to the DOM before or after our patch
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLScriptElement && isBlockedUrl(node.src)) {
          node.type = "javascript/blocked";
          node.src = "";
          node.remove();
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

const Telemetry: Plugin = {
  name: "Telemetry",
  description: "Block telemetry and analytics requests.",
  patches: [],
  mainEntry: blockTelemetry,
  enableByDefault: true,
};

export default Telemetry;
