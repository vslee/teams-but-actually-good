import { Theme, registerTheme } from "../interface";
import { themes } from "./theme-registry";

function parseTheme(cssContent: string, index: number): Theme {
  const metadata: Partial<Theme> = {};
  const headerMatch = cssContent.match(/\/\*([\s\S]*?)\*\//);

  if (headerMatch?.[1]) {
    const metadataRegex = /@([a-zA-Z]+)\s+(.+)/g;
    let match: RegExpExecArray | null = null;

    while ((match = metadataRegex.exec(headerMatch[1])) !== null) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();

      switch (key) {
        case "name":
          metadata.name = value;
          break;
        case "description":
          metadata.description = value;
          break;
        case "author":
          metadata.author = value;
          break;
        case "version":
          metadata.version = value;
          break;
        case "source":
          metadata.source = value;
          break;
        case "website":
          metadata.website = value;
          break;
        default:
          break;
      }
    }
  }

  return {
    name: metadata.name ?? `Theme ${index + 1}`,
    description: metadata.description ?? "No description provided.",
    author: metadata.author ?? "Unknown",
    version: metadata.version ?? "1.0.0",
    source: metadata.source ?? "",
    website: metadata.website ?? "",
    css: cssContent,
  };
}

export default async function loadThemes(): Promise<boolean> {
  try {
    themes.forEach((themeCss, index) => {
      try {
        const theme = parseTheme(themeCss, index);
        registerTheme(theme);

        console.log("loaded theme:", theme.name);
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
}
