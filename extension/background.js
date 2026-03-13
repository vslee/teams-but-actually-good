/**
 * Background script for Teams but (actually) good.
 *
 * - Manages dynamic content script registration (injection.js) based on the
 *   extensionEnabled storage flag.  The script is never listed in manifest
 *   content_scripts for Chrome — it is registered/unregistered via
 *   chrome.scripting so that toggling the extension on/off works without
 *   reloading the extension.
 *
 *   On Firefox the script IS listed as a static content_script in the manifest
 *   (the only way to get world: "MAIN" working reliably).  Toggling is handled
 *   via chrome.scripting.updateContentScripts({ enabled }).
 *
 * - When devModeEnabled is true (Chrome only), keeps a WebSocket connection to
 *   the local dev server (scripts/dev.ts).  When the server sends "reload",
 *   the extension reloads so Chrome re-reads content scripts from disk before
 *   the Teams tab is refreshed.
 *
 * - MV3 service workers are suspended by Chrome after a short idle period,
 *   silently dropping the WebSocket.  A chrome.alarms keepalive (fired every
 *   ~25 s) wakes the SW and re-establishes the connection when in dev mode.
 */

// Firefox exposes `browser` as a global; Chrome only has `chrome`.
const IS_FIREFOX = typeof browser !== "undefined";

const DEV_SERVER_URL = "ws://localhost:9223";
const KEEPALIVE_ALARM = "tbg-dev-keepalive";
const CONTENT_SCRIPT_ID = "tbg-injection";
const ONBOARDING_USAGE_URL = "https://docs.teamsbutactuallygood.dev/usage";
const TEAMS_WEB_APP_URL = "https://teams.microsoft.com/";
const TEAMS_MATCHES = [
  "*://teams.microsoft.com/*",
  "*://*.teams.microsoft.com/*",
];

// Module-level ref so we can check readyState across alarm wakeups.
let ws = null;


function connect() {
  // Already connected or mid-handshake – nothing to do.
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(DEV_SERVER_URL);
  } catch {
    // Dev server not running – retry silently.
    ws = null;
    setTimeout(connect, 2000);
    return;
  }

  ws.onopen = () => {
    chrome.storage.local.get({ autoReloadEnabled: true }, ({ autoReloadEnabled }) => {
      ws.send(JSON.stringify({ type: "ready", autoReloadEnabled }));
    });
  };

  ws.onmessage = (e) => {
    if (e.data === "reload") {
      chrome.runtime.reload();
    }
  };

  ws.onclose = () => {
    ws = null;
    // Only schedule a reconnect when dev mode is still active.
    chrome.storage.local.get({ devModeEnabled: false }, ({ devModeEnabled }) => {
      if (devModeEnabled) setTimeout(connect, 1000);
    });
  };

  ws.onerror = () => {
    // onclose fires right after onerror, which already schedules a reconnect.
  };
}

function disconnectWs() {
  if (ws) {
    ws.onclose = null; // prevent the onclose handler from scheduling a reconnect
    ws.onerror = null;
    ws.close();
    ws = null;
  }
}

async function syncContentScript() {
  const { extensionEnabled = true } = await chrome.storage.local.get({ extensionEnabled: true });

  const registered = await chrome.scripting
    .getRegisteredContentScripts({ ids: [CONTENT_SCRIPT_ID] })
    .catch(() => []);
  const isRegistered = registered.length > 0;

  if (extensionEnabled && !isRegistered) {
    await chrome.scripting.registerContentScripts([
      {
        id: CONTENT_SCRIPT_ID,
        js: ["injection.js"],
        matches: TEAMS_MATCHES,
        runAt: "document_start",
        world: "MAIN",
        allFrames: false,
      },
    ]).catch((err) => console.error("[TBG] Failed to register content script:", err));
  } else if (!extensionEnabled && isRegistered) {
    await chrome.scripting
      .unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] })
      .catch((err) => console.error("[TBG] Failed to unregister content script:", err));
  }
}

function enableDevMode() {
  // periodInMinutes: 0.4 ≈ 24 s – keeps the SW alive between alarm firings.
  chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 });
  connect();
}

function disableDevMode() {
  chrome.alarms.clear(KEEPALIVE_ALARM);
  disconnectWs();
}

async function runInstallOnboarding(details) {
  if (details.reason !== "install") {
    return;
  }

  // Open docs first so users land on instructions, then preload Teams in a background tab.
  await chrome.tabs.create({ url: ONBOARDING_USAGE_URL, active: true });
  await chrome.tabs.create({ url: TEAMS_WEB_APP_URL, active: false });
}

// On install or update: register the content script if the extension is enabled.
chrome.runtime.onInstalled.addListener(async (details) => {
  await syncContentScript();

  await runInstallOnboarding(details).catch((err) => {
    console.error("[TBG] Failed onboarding tab flow:", err);
  });

  if (!IS_FIREFOX) {
    const { devModeEnabled = false } = await chrome.storage.local.get({ devModeEnabled: false });
    if (devModeEnabled) enableDevMode();
  }
});

// On SW startup (after suspension): re-connect WS if dev mode is still active.
if (!IS_FIREFOX) {
  chrome.storage.local.get({ devModeEnabled: false }, ({ devModeEnabled }) => {
    if (devModeEnabled) enableDevMode();
  });

  // Keepalive alarm: re-connect WebSocket if dev mode is active.
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === KEEPALIVE_ALARM) {
      chrome.storage.local.get({ devModeEnabled: false }, ({ devModeEnabled }) => {
        if (devModeEnabled) connect();
      });
    }
  });
}

// React to storage changes from the popup.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if ("extensionEnabled" in changes) {
    syncContentScript().catch(console.error);
  }

  if (!IS_FIREFOX) {
    if ("devModeEnabled" in changes) {
      if (changes.devModeEnabled.newValue) {
        enableDevMode();
      } else {
        disableDevMode();
      }
    }

    if ("autoReloadEnabled" in changes && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "autoReloadEnabled", autoReloadEnabled: changes.autoReloadEnabled.newValue }));
    }
  }
});
