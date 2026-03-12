import { Theme, registerTheme } from "../interface";
import { themes } from "./theme-registry";

function isValidTheme(obj: any): obj is Theme {
  return obj && typeof obj.name === "string";
}

export default async function loadThemes(): Promise<Boolean> {
  try {
    for (const theme of themes) {
      try {
        if (!isValidTheme(theme)) {
          console.error(`invalid theme structure:`, theme);
          continue;
        }

        registerTheme(theme);

        console.log("loaded theme:", theme.name);
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
