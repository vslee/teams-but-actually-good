const extensionToggle = document.getElementById("extensionToggle");
const devModeToggle = document.getElementById("devModeToggle");
const autoReloadToggle = document.getElementById("autoReloadToggle");
const devRows = document.getElementById("devRows");

// On Firefox, hide dev options and show a notice instead.
const isFirefox = navigator.userAgent.includes("Firefox");
if (isFirefox) {
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
