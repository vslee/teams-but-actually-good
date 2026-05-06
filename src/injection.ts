import easyLogger from "./utils/easy-logger";
import { AnyModuleFactory } from "./types/modules";
import {
  SYM_IS_PROXIED_FACTORY,
  SYM_ORIGINAL_FACTORY,
  WebpackRequire,
  PatchedModuleFactory,
  pluginRegistry,
} from "./interface";
import PluginLoader from "./utils/plugin-loader";
import ThemeLoader from "./utils/theme-loader";
import { themeManager } from "./utils/themes";

document.documentElement?.setAttribute("data-tbg-injection", "booting");

easyLogger("info", "Booting up...");

ThemeLoader().then((success) => {
  if (success) {
    easyLogger("info", "Themes loaded successfully");
  } else {
    easyLogger("error", "Something went wrong when loading themes");
  }
});
// Load all plugins dynamically
PluginLoader().then((success) => {
  if (success) {
    easyLogger("info", "All plugins loaded successfully");
  } else {
    easyLogger("error", "Something went wrong when loading plugins");
  }
});

const teamsWindow = window;

// trusted type manipulation (Required for eval() to work with CSP)
let stolenPolicy: TrustedTypePolicy | null = null;

if (teamsWindow.trustedTypes && teamsWindow.trustedTypes.createPolicy) {
  const originalCreatePolicy = teamsWindow.trustedTypes.createPolicy.bind(
    teamsWindow.trustedTypes,
  );

  // we pick a highly-privileged policy name from microsoft's own hardcoded whitelist
  const targetPolicyName = "@msteams/frameworks-loader#load-build-chunk";

  try {
    // basically here we have godmode
    stolenPolicy = originalCreatePolicy(targetPolicyName, {
      createScript: (s: string) => s,
      createScriptURL: (s: string) => s,
      createHTML: (s: string) => s,
    });

    // Expose for internal extension use (e.g. CodeMirror needs a TrustedScript policy)
    teamsWindow.__tbg_trusted_policy = stolenPolicy ?? undefined;
    // Expose nonce lazily so plugins can inject inline scripts past CSP.
    // Defined as a getter so it resolves at read-time, not at policy-steal time.
    Object.defineProperty(teamsWindow, "__tbg_csp_nonce", {
      get: () => getCspNonce(),
      configurable: true,
      enumerable: false,
    });

    // trap the browser's createPolicy function
    teamsWindow.trustedTypes.createPolicy = function (
      name: string,
      rules?: TrustedTypePolicyOptions,
    ) {
      if (name === targetPolicyName) {
        easyLogger("info", `Teams requested ${name}. Handing over our policy`);
        return stolenPolicy!;
      }
      return originalCreatePolicy(name, rules);
    };
  } catch (error) {
    easyLogger("error", "Failed to hijack Trusted Types:", error as string);
  }
}

let wreq: WebpackRequire | null = null;
const allWebpackInstances = new Set<WebpackRequire>();
const patchedModules = new Set<PropertyKey>();
let cachedNonce: string | undefined = undefined;

const define: typeof Reflect.defineProperty = (target, p, attributes) => {
  if (Object.prototype.hasOwnProperty.call(attributes, "value")) {
    attributes.writable = true;
  }

  return Reflect.defineProperty(target, p, {
    configurable: true,
    enumerable: true,
    ...attributes,
  });
};

function logger(level: "info" | "warn" | "error", ...args: string[]) {
  const prefix = "[TeamsPatcher]";
  console[level](prefix, ...args);
}

function getCspNonce(): string | undefined {
  if (cachedNonce) return cachedNonce;

  // Priority 1: document.currentScript — when the Function.prototype.m setter fires
  // we are synchronously inside the Teams bundle execution, so currentScript still
  // points to its <script nonce="…"> element before Firefox hides the attribute.
  const current = document.currentScript as HTMLScriptElement | null;
  if (current?.nonce) {
    cachedNonce = current.nonce;
    logger("info", `Found CSP nonce from currentScript: ${cachedNonce}`);
    return cachedNonce;
  }

  // Priority 2: scan already-inserted scripts (works on Chrome; may fail on Firefox
  // after nonce-hiding clears the attribute, but try anyway as a fallback).
  const scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].nonce) {
      cachedNonce = scripts[i].nonce;
      logger("info", `Found CSP nonce: ${cachedNonce}`);
      return cachedNonce;
    }
  }

  logger("warn", "No CSP nonce found in document");
  return undefined;
}

// Firefox hides the nonce attribute shortly after a script executes, making
// element.nonce unreliable when scanned later. Capture it the moment the first
// <script nonce="…"> element is inserted — before any hiding can occur.
{
  const nonceCapture = new MutationObserver((mutations) => {
    if (cachedNonce) {
      nonceCapture.disconnect();
      return;
    }
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLScriptElement && node.nonce) {
          cachedNonce = node.nonce;
          logger(
            "info",
            `Captured CSP nonce early via MutationObserver: ${cachedNonce}`,
          );
          nonceCapture.disconnect();
          return;
        }
      }
    }
  });
  nonceCapture.observe((document.documentElement ?? document) as Element, {
    childList: true,
    subtree: true,
  });
}

// Hook Function.prototype.m to intercept webpack module registry initialization
define(Function.prototype, "m", {
  enumerable: false,

  set(this: WebpackRequire, originalModules: WebpackRequire["m"]) {
    define(this, "m", { value: originalModules });

    // Validate this is a legitimate webpack instance
    const { stack } = new Error();
    if (!stack?.includes("http") || stack.match(/at \d+? \(/)) {
      return;
    }

    const fileName = stack.match(/\/([^/]+\.js)/)?.[1];
    logger(
      "info",
      "Potential webpack instance detected" +
        (fileName ? ` in ${fileName}` : ""),
    );

    // Filter out non-Teams webpack instances
    if (
      fileName &&
      ["sentry", "devtools"].some((name) =>
        fileName.toLowerCase().includes(name),
      )
    ) {
      logger("info", "Skipping non-Teams webpack instance:", fileName);
      return;
    }

    const patchThisInstance = () => {
      logger(
        "info",
        "Patching webpack instance" + (fileName ? ` from ${fileName}` : ""),
      );
      allWebpackInstances.add(this);

      // Initialize wreq if this is the first instance
      if (wreq == null && this.c != null) {
        logger("info", "Initializing main WebpackRequire reference");
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        wreq = this;
      }

      // Proxy existing module factories
      for (const moduleId in originalModules) {
        proxyModuleFactory(
          originalModules,
          moduleId,
          originalModules[moduleId],
        );
      }

      // Create proxy to intercept future factory additions
      const proxiedModuleFactories = new Proxy(originalModules, {
        set: (target, moduleId, factory, receiver) => {
          return proxyModuleFactory(target, moduleId, factory, receiver);
        },
      });

      define(this, "m", { value: proxiedModuleFactories });

      // Override defineExports to make exports configurable (useful for advanced patching)
      if (this.d) {
        this.d = function (exports, definition) {
          for (const key in definition) {
            if (
              Object.prototype.hasOwnProperty.call(definition, key) &&
              !Object.prototype.hasOwnProperty.call(exports, key)
            ) {
              Object.defineProperty(exports, key, {
                enumerable: true,
                configurable: true,
                get: definition[key],
              });
            }
          }
        };
      }
    };
    patchThisInstance();
  },
});

function proxyModuleFactory(
  moduleFactories: Record<PropertyKey, AnyModuleFactory>,
  moduleId: PropertyKey,
  factory: AnyModuleFactory,
  receiver?: any,
): boolean {
  // Wrap the factory in a proxy that patches lazily on first call
  const proxiedFactory = new Proxy(factory, {
    apply(target, thisArg, argArray) {
      // Check if already patched
      if ((target as any)[SYM_ORIGINAL_FACTORY] != null) {
        return runPatchedFactory(
          target as PatchedModuleFactory,
          thisArg,
          argArray as [module: any, exports: any, require: any],
        );
      }

      // Patch the factory now (lazy patching)
      const patchedFactory = patchFactory(moduleId, target);
      return runPatchedFactory(
        patchedFactory,
        thisArg,
        argArray as [module: any, exports: any, require: any],
      );
    },

    get(target, p, receiver) {
      if (p === SYM_IS_PROXIED_FACTORY) {
        return true;
      }

      const originalFactory = (target as any)[SYM_ORIGINAL_FACTORY] ?? target;

      if (p === "toString") {
        return originalFactory.toString.bind(originalFactory);
      }

      return Reflect.get(target, p, receiver);
    },
  });

  return Reflect.set(moduleFactories, moduleId, proxiedFactory, receiver);
}

/**
 * Load plugins
 *
 * @param {PropertyKey} moduleId
 * @param {AnyModuleFactory} originalFactory
 * @return {*}  {PatchedModuleFactory}
 */
function patchFactory(
  moduleId: PropertyKey,
  originalFactory: AnyModuleFactory,
): PatchedModuleFactory {
  const originalFactoryCode = String(originalFactory);
  const isArrowFunction = originalFactoryCode.startsWith("(");

  // Prepend "0," to make it a valid expression for eval
  let code =
    "0," +
    (!isArrowFunction ? "function" : "") +
    originalFactoryCode.slice(originalFactoryCode.indexOf("("));
  let patchedFactory = originalFactory;
  let wasPatched = false;

  // Gather all patches from registered plugins
  const allPatches = Object.values(pluginRegistry).flatMap((plugin) =>
    plugin.patches && plugin.enable !== false ? plugin.patches : [],
  );

  for (const patch of allPatches) {
    const moduleMatches =
      typeof patch.find === "string"
        ? code.includes(patch.find)
        : (patch.find.global && (patch.find.lastIndex = 0),
          patch.find.test(code));

    if (!moduleMatches) {
      continue;
    }

    const patchPlugin = (patch as any).plugin;
    easyLogger(
      "info",
      `Module ${String(moduleId)} matches patch from ${patchPlugin}: ${patch.find}`,
    );

    // Handle both single replacement and array of replacements
    const replacements = Array.isArray(patch.replacement)
      ? patch.replacement
      : [patch.replacement];

    for (const replacement of replacements) {
      const lastCode = code;

      try {
        if (typeof replacement.match !== "string" && replacement.match.global) {
          replacement.match.lastIndex = 0;
        }

        // Replace $self with plugin reference if patch has a plugin name
        let replaceString = replacement.replace;
        if (patchPlugin) {
          replaceString = replaceString.replace(
            /\$self/g,
            `window.__TEAMS_PLUGINS__["${patchPlugin}"]`,
          );
        }

        const newCode = code.replace(replacement.match, replaceString);

        if (newCode === code) {
          easyLogger(
            "warn",
            `Patch from ${patchPlugin || "unknown"} had no effect on module ${String(moduleId)}`,
          );
          continue;
        }

        code = newCode;

        // CSP blocks eval(), so we inject as a script element instead
        const globalVarName = `__TEAMS_PATCHED_${String(moduleId).replace(/[^a-zA-Z0-9]/g, "_")}__`;
        // Wrap in parens to ensure correct operator precedence: (0,function) assigns the function, not 0
        const errorVarName = `${globalVarName}_ERROR`;
        const patchedSource = `
try {
  window.${globalVarName} = (${code});
} catch (e) {
  window.${errorVarName} = e;
  console.error('[TeamsPatcher] Script execution error:', e);
}
//# sourceURL=webpack-module-${String(moduleId)}-patched`;

        // Inject the patched code as a script element to bypass CSP eval restriction
        const script = document.createElement("script");

        // Get CSP nonce (required for inline scripts)
        const nonce = getCspNonce();
        if (nonce) {
          script.nonce = nonce;
        }

        // Use Trusted Types policy if available
        if (stolenPolicy) {
          script.textContent = stolenPolicy.createScript(
            patchedSource,
          ) as unknown as string;
        } else {
          script.textContent = patchedSource;
        }

        document.head.appendChild(script);
        document.head.removeChild(script); // Clean up immediately

        // Check if there was an execution error
        if ((window as any)[errorVarName]) {
          const execError = (window as any)[errorVarName];
          delete (window as any)[errorVarName];
          throw new Error(
            `Script execution failed: ${execError.message || execError}`,
          );
        }

        // Retrieve the patched factory from the global variable
        patchedFactory = (window as any)[globalVarName];
        delete (window as any)[globalVarName]; // Clean up global

        easyLogger(
          "info",
          `✓ Successfully patched module ${String(moduleId)} with ${patchPlugin || "patch"}`,
        );

        wasPatched = true;
      } catch (error) {
        easyLogger(
          "error",
          `Failed to apply patch from ${patchPlugin || "unknown"} to module ${String(moduleId)}:`,
          error as string,
        );
        code = lastCode;
        patchedFactory = originalFactory;
      }
    }
  }

  // Mark the factory as patched
  (patchedFactory as any)[SYM_ORIGINAL_FACTORY] = originalFactory;

  if (wasPatched) {
    patchedModules.add(moduleId);
  }

  return patchedFactory as PatchedModuleFactory;
}

function runPatchedFactory(
  patchedFactory: PatchedModuleFactory,
  thisArg: unknown,
  argArray: [module: any, exports: any, require: any],
): any {
  const originalFactory = patchedFactory[SYM_ORIGINAL_FACTORY];
  const [module] = argArray;

  // Restore original factory in webpack's module cache
  if (wreq) {
    for (const wreqInstance of allWebpackInstances) {
      if (wreqInstance.m[module.id]) {
        define(wreqInstance.m, module.id, { value: originalFactory });
      }
    }
  }

  try {
    const result = patchedFactory.apply(thisArg, argArray);
    return result;
  } catch (error) {
    easyLogger(
      "error",
      `Error in patched factory for module ${String(module.id)}:`,
      error as string,
    );
    return originalFactory.apply(thisArg, argArray);
  }
}

new MutationObserver(() => {
  Object.values(pluginRegistry).forEach((plugin) => {
    if (typeof plugin.onChangeObserved === "function" && plugin.enable) {
      try {
        plugin.onChangeObserved();
      } catch (err) {
        console.error(err);
      }
    }
  });
}).observe(document, {
  childList: true,
  subtree: true,
});

window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hostname.includes("teams.microsoft.com")) {
    easyLogger("info", `Skipping injection on ${window.location.hostname}`);
    return;
  }

  // execute mainEntry of plugins
  Object.values(pluginRegistry).forEach((plugin) => {
    if (typeof plugin.mainEntry === "function" && plugin.enable) {
      try {
        plugin.mainEntry();
        easyLogger(
          "info",
          `Executed main entry of plugin ${plugin.name || "unknown"}`,
        );
      } catch (error) {
        easyLogger(
          "error",
          `Error executing main entry of plugin ${plugin.name || "unknown"}:`,
          error as string,
        );
      }
    }
  });

  themeManager();

  document.documentElement?.setAttribute("data-tbg-injection", "ready");
  easyLogger("info", "TypeScript Injection Successful!");
});
