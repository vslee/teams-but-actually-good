const extensionToggle = document.getElementById("extensionToggle");
const devModeToggle = document.getElementById("devModeToggle");
const autoReloadToggle = document.getElementById("autoReloadToggle");
const devRows = document.getElementById("devRows");
const currentVersionValue = document.getElementById("currentVersionValue");
const latestVersionValue = document.getElementById("latestVersionValue");
const activeStatusValue = document.getElementById("activeStatusValue");
const injectionStatusValue = document.getElementById("injectionStatusValue");

const META_URL = "https://github.com/LeonimusTTV/teams-but-actually-good/releases/latest/download/injection.meta.json";
const TEAMS_HOST_PATTERN = /(^|\.)teams\.microsoft\.com$/i;

function setStatus(el, text, kind) {
  el.textContent = text;
  el.classList.remove("ok", "warn", "pending");
  el.classList.add(kind);
}

function isTeamsUrl(url) {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return TEAMS_HOST_PATTERN.test(hostname);
  } catch {
    return false;
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function getInjectionMarker(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        const marker = document.documentElement?.getAttribute("data-tbg-injection");
        return {
          marker,
          hostname: window.location.hostname
        };
      }
    });
    return result?.result ?? null;
  } catch {
    return null;
  }
}

async function updateVersionInfo() {
  const currentVersion = chrome.runtime.getManifest().version;
  setStatus(currentVersionValue, currentVersion || "Unknown", "ok");

  try {
    const response = await fetch(META_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const metadata = await response.json();
    if (!metadata || typeof metadata.version !== "string" || metadata.version.length === 0) {
      throw new Error("Missing version in metadata");
    }

    const latest = metadata.version;
    const kind = latest === currentVersion ? "ok" : "warn";
    setStatus(latestVersionValue, latest, kind);
  } catch {
    setStatus(latestVersionValue, "Unavailable", "warn");
  }
}

async function updateRuntimeStatus() {
  const { extensionEnabled = true } = await chrome.storage.local.get({ extensionEnabled: true });
  const activeTab = await getActiveTab();

  if (!extensionEnabled) {
    setStatus(activeStatusValue, "Disabled", "warn");
    setStatus(injectionStatusValue, "Disabled", "warn");
    return;
  }

  if (!activeTab || !isTeamsUrl(activeTab.url)) {
    setStatus(activeStatusValue, "Inactive", "warn");
    setStatus(injectionStatusValue, "N/A", "pending");
    return;
  }

  setStatus(activeStatusValue, "Active", "ok");

  const marker = await getInjectionMarker(activeTab.id);
  if (marker?.marker === "ready") {
    setStatus(injectionStatusValue, "Success", "ok");
    return;
  }

  if (marker?.marker === "booting") {
    setStatus(injectionStatusValue, "Booting", "pending");
    return;
  }

  setStatus(injectionStatusValue, "Not detected", "warn");
}

// On Firefox/Safari, hide dev options and show a notice instead.
const isFirefox = navigator.userAgent.includes("Firefox");
const isSafari = navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Firefox");
if (isFirefox || isSafari) {
  document.getElementById("devSection").style.display = "none";
  document.getElementById("firefoxDevNotice").style.display = "";
}

// Load current settings (defaults match background.js assumptions).
chrome.storage.local.get(
  { extensionEnabled: true, devModeEnabled: false, autoReloadEnabled: true },
  ({ extensionEnabled, devModeEnabled, autoReloadEnabled }) => {
    extensionToggle.checked = extensionEnabled;
    devModeToggle.checked = devModeEnabled;
    autoReloadToggle.checked = autoReloadEnabled;
    devRows.style.display = devModeEnabled ? "flex" : "none";
  }
);

extensionToggle.addEventListener("change", () => {
  chrome.storage.local.set({ extensionEnabled: extensionToggle.checked });
});

devModeToggle.addEventListener("change", () => {
  const enabled = devModeToggle.checked;
  chrome.storage.local.set({ devModeEnabled: enabled });
  devRows.style.display = enabled ? "flex" : "none";
});

autoReloadToggle.addEventListener("change", () => {
  chrome.storage.local.set({ autoReloadEnabled: autoReloadToggle.checked });
});

updateVersionInfo();
updateRuntimeStatus();
