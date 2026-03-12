import { SettingsDefinition, OptionType } from "../types/types";

const STORAGE_PREFIX = "teams-but-good:";
const MAIN_SETTINGS_KEY = `${STORAGE_PREFIX}main`;
const PLUGIN_SETTINGS_PREFIX = `${STORAGE_PREFIX}plugin:`;

export async function getMainSetting(key: string): Promise<string | null> {
  try {
    const mainSettings = localStorage.getItem(MAIN_SETTINGS_KEY);
    if (!mainSettings) return null;

    const settings = JSON.parse(mainSettings);
    return settings[key] ?? null;
  } catch (error) {
    console.error("[Storage] Error getting main setting:", error);
    return null;
  }
}

export async function setMainSetting(key: string, value: any): Promise<void> {
  try {
    const mainSettings = localStorage.getItem(MAIN_SETTINGS_KEY);
    const settings = mainSettings ? JSON.parse(mainSettings) : {};

    settings[key] = value;
    localStorage.setItem(MAIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("[Storage] Error setting main setting:", error);
  }
}

/**
 * Get all settings for a specific plugin
 * @param pluginName - The name of the plugin (e.g., "ChangeEmojiChooserToTenor")
 */
export async function getPluginSettings<T = Record<string, any>>(
  pluginName: string,
): Promise<T | null> {
  try {
    const key = `${PLUGIN_SETTINGS_PREFIX}${pluginName}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`[Storage] Error getting settings for ${pluginName}:`, error);
    return null;
  }
}

/**
 * Set all settings for a specific plugin (overwrites existing)
 */
export async function setPluginSettings(
  pluginName: string,
  settings: Record<string, any>,
): Promise<void> {
  try {
    const key = `${PLUGIN_SETTINGS_PREFIX}${pluginName}`;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    console.error(`[Storage] Error setting settings for ${pluginName}:`, error);
  }
}

/**
 * Update specific settings for a plugin (merges with existing)
 */
export async function updatePluginSettings(
  pluginName: string,
  updates: Record<string, any>,
): Promise<void> {
  const currentSettings = (await getPluginSettings(pluginName)) || {};
  await setPluginSettings(pluginName, { ...currentSettings, ...updates });
}

/**
 * Get a specific setting value for a plugin
 */
export async function getPluginSetting<T = any>(
  pluginName: string,
  key: string,
): Promise<T | null> {
  const settings = await getPluginSettings(pluginName);
  return settings?.[key] ?? null;
}

/**
 * Set a specific setting value for a plugin
 */
export async function setPluginSetting(
  pluginName: string,
  key: string,
  value: any,
): Promise<void> {
  await updatePluginSettings(pluginName, { [key]: value });
}

/**
 * Delete all settings for a plugin
 */
export async function deletePluginSettings(pluginName: string): Promise<void> {
  try {
    const key = `${PLUGIN_SETTINGS_PREFIX}${pluginName}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error(
      `[Storage] Error deleting settings for ${pluginName}:`,
      error,
    );
  }
}

/**
 * Get all plugin names that have settings stored
 */
export async function getAllPluginNames(): Promise<string[]> {
  const pluginNames: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PLUGIN_SETTINGS_PREFIX)) {
      const pluginName = key.substring(PLUGIN_SETTINGS_PREFIX.length);
      pluginNames.push(pluginName);
    }
  }

  return pluginNames;
}

/**
 * Clear all Teams But Good settings (main + all plugins)
 */
export async function clearAllSettings(): Promise<void> {
  const keys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }

  keys.forEach((key) => localStorage.removeItem(key));
  console.log("[Storage] Cleared all settings");
}

const FALLBACK_DEFAULTS: Partial<Record<OptionType, unknown>> = {
  [OptionType.STRING]: "",
  [OptionType.NUMBER]: 0,
  [OptionType.BOOLEAN]: false,
  [OptionType.BIGINT]: BigInt(0),
};

/**
 * Initialise settings for a plugin from its schema.
 * - If the plugin already has settings stored, those are returned as-is (user values preserved).
 * - If no settings exist yet, default values are derived from the schema, saved, and returned.
 */
export async function initPluginSettings(
  pluginName: string,
  settingsDef: SettingsDefinition,
): Promise<Record<string, unknown>> {
  const existing = await getPluginSettings(pluginName);
  if (existing) return existing;

  const defaultSettings: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(settingsDef)) {
    if ("default" in def) {
      defaultSettings[key] = def.default;
    } else if (def.type === OptionType.SELECT) {
      defaultSettings[key] =
        def.options.find((opt) => opt.default)?.value ?? null;
    } else {
      defaultSettings[key] = FALLBACK_DEFAULTS[def.type] ?? null;
    }
  }

  await setPluginSettings(pluginName, defaultSettings);
  return defaultSettings;
}
