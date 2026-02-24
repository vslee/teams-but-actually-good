import fs from "fs";
import path from "path";
import { Plugin, registerPlugin } from "../src/interface";

const pluginDir = path.resolve(__dirname, "../src/teams-plugin");

interface LoadedPlugin {
  name: string;
  plugin: Plugin;
  path: string;
}

function isValidPlugin(obj: any): obj is Plugin {
  return obj && typeof obj.name === "string" && Array.isArray(obj.patches);
}

async function loadPlugins(): Promise<LoadedPlugin[]> {
  const loadedPlugins: LoadedPlugin[] = [];

  try {
    const entries = fs.readdirSync(pluginDir, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory());

    for (const folder of folders) {
      try {
        const folderPath = path.join(pluginDir, folder.name);

        // Look for index file first
        const indexFiles = ["index.ts", "index.tsx"].find((file) =>
          fs.existsSync(path.join(folderPath, file)),
        );

        if (!indexFiles) {
          console.warn(`no index file found in ${folder.name}`);
          continue;
        }

        const modulePath = path.join(folderPath, indexFiles);
        const module = await import(modulePath);
        const plugin = module.default;

        if (!isValidPlugin(plugin)) {
          console.error(`invalid plugin structure in ${folder.name}`);
          continue;
        }

        registerPlugin(plugin);
        loadedPlugins.push({
          name: plugin.name,
          plugin,
          path: modulePath,
        });

        console.log("loaded plugin:", plugin.name);
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error(error);
  }

  return loadedPlugins;
}

// Run the loader
loadPlugins().then((plugins) => {
  console.log(`\n📦 Loaded ${plugins.length} plugin(s):`);
  plugins.forEach((p) => {
    console.log(`   - ${p.name}: ${p.plugin.description || "No description"}`);
  });
});
