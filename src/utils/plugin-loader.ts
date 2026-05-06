import { Plugin, registerPlugin } from "../interface";
import { plugins } from "./plugin-registry";
import { getPluginSetting, initPluginSettings } from "./storage";

function isValidPlugin(obj: object): obj is Plugin {
  return (
    obj &&
    typeof (obj as Plugin).name === "string" &&
    Array.isArray((obj as Plugin).patches)
  );
}

export default async function loadPlugins(): Promise<boolean> {
  try {
    for (const plugin of plugins) {
      try {
        if (!isValidPlugin(plugin)) {
          console.error(`invalid plugin structure:`, plugin);
          continue;
        }

        const isPluginEnable = await getPluginSetting(plugin.name, "enabled");

        plugin.enable =
          isPluginEnable !== null
            ? (isPluginEnable as boolean)
            : plugin.enableByDefault === true;

        // Init settings from schema: loads stored values or saves defaults
        if (plugin.settingsDef) {
          plugin.settings = await initPluginSettings(
            plugin.name,
            plugin.settingsDef,
          );
        }

        registerPlugin(plugin);

        console.log("loaded plugin:", plugin.name);
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
}
