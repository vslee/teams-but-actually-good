import { Styles, themeRegistry } from "../interface";
import { getMainSetting } from "./storage";
import { applyStyles } from "./styles";

let theme: string | null = null;
(async () => {
  theme = await getMainSetting("theme");
})();

export async function themeManager() {
  if (!theme) return;

  if (!themeRegistry[theme].styles) return;

  applyStyles(themeRegistry[theme].styles as Styles);
}
