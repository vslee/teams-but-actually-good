import { Plugin, registerPlugin } from "../interface";
import { plugins } from "./plugin-registry";

function isValidPlugin(obj: any): obj is Plugin {
  return obj && typeof obj.name === "string" && Array.isArray(obj.patches);
}

export default async function loadPlugins(): Promise<Boolean> {
  try {
    for (const plugin of plugins) {
      try {
        if (!isValidPlugin(plugin)) {
          console.error(`invalid plugin structure:`, plugin);
          continue;
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
