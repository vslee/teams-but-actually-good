import { themeRegistry } from "../interface";
import { getMainSetting } from "./storage";
import { injectStyles } from "./styles";

let theme: string | null = null;
(async () => {
  theme = await getMainSetting("theme");
})();

export async function themeManager() {
  if (!theme) return;

  let css = "";

  if (theme === "custom") {
    css = (await getMainSetting("customCss")) || "";
  } else {
    css = themeRegistry[theme]?.css || "";
  }

  injectStyles(css);

  //if (!themeRegistry[theme].styles) return;

  //applyStyles(themeRegistry[theme].styles as Styles);
}
