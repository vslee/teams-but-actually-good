import { load, Store, StoreOptions } from "@tauri-apps/plugin-store";

const options: StoreOptions = {
  defaults: {},
  autoSave: true,
};

let mainSettings: Store;
//let pluginSettings: Store;

// Initialize stores (call this once at app startup)
export async function initializeStorage() {
  mainSettings = await load("teams-settings.json", options);
  // that's for later
  //pluginSettings = await load("teams-plugin-settings.json", options);
}

export async function getMainSetting<T = any>(key: string): Promise<T | null> {
  return (await mainSettings.get(key)) as T | null;
}

export async function setMainSetting(key: string, value: any): Promise<void> {
  await mainSettings.set(key, value);
}
