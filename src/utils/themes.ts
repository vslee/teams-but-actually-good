import { themeRegistry } from "../interface";
import { getMainSetting } from "./storage";
import { injectStyles } from "./styles";

let theme: string | null | undefined;
(async () => {
  theme = await getMainSetting("theme");
})();

export async function themeManager() {
  if (!theme) return;

  const css =
    theme === "custom"
      ? (await getMainSetting("customCss")) || ""
      : themeRegistry[theme]?.css || "";

  injectStyles(css);

  //if (!themeRegistry[theme].styles) return;

  //applyStyles(themeRegistry[theme].styles as Styles);
}
