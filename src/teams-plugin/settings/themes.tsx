import React from "react";
import windowUrl from "../../svgs/window.svg";
import { getMainSetting, setMainSetting } from "../../utils/storage";
import { themeRegistry } from "../../interface";

export default function Themes({ ReactLib }: { ReactLib: typeof React }) {
  void ReactLib;
  const [needRestart, setNeedRestart] = ReactLib.useState(false);
  const [selectedTheme, setSelectedTheme] = ReactLib.useState<string | null>(
    null,
  );

  ReactLib.useEffect(() => {
    getMainSetting("theme").then((saved) => {
      if (saved && themeRegistry[saved]) {
        setSelectedTheme(saved);
        themeRegistry[saved].enable = true;
      }
    });
  }, []);

  function handleThemeChange(themeName: string) {
    setSelectedTheme(themeName);
    setMainSetting("theme", themeName);
    setNeedRestart(true);
  }

  /** @jsx ReactLib.createElement */
  return (
    <div>
      <div className="tbg-container">
        <div className="tbg-default-display-flex">
          <img
            src={windowUrl}
            style={{
              height: "stretch",
              filter: "brightness(0) invert(1)",
            }}
            aria-hidden="true"
          />
          <span>Themes</span>
        </div>
        <div className="tbg-plugin-container">
          {Object.values(themeRegistry).map((theme) => (
            <div className="tbg-plugins-grid" key={theme.name}>
              <label
                htmlFor={`theme-radio-${theme.name}`}
                className="tbg-box-basic"
                style={{
                  minHeight: 0,
                  cursor: "pointer",
                  userSelect: "none",
                  display: "block",
                }}
              >
                <div className="tbg-plugin-header">
                  <span className="tbg-plugin-name">{theme.name}</span>
                  <div className="tbg-plugin-controls">
                    <input
                      id={`theme-radio-${theme.name}`}
                      type="radio"
                      name="theme"
                      value={theme.name}
                      checked={selectedTheme === theme.name}
                      onChange={() => handleThemeChange(theme.name)}
                      style={{ display: "none" }}
                    />
                    <svg
                      font-size="20px"
                      className="tbg-purple-color"
                      fill="currentColor"
                      aria-hidden="true"
                      width="1em"
                      height="1em"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {selectedTheme === theme.name ? (
                        <path
                          d="M10 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-13a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-7 8a7 7 0 1 1 14 0 7 7 0 0 1-14 0Z"
                          fill="currentColor"
                        ></path>
                      ) : (
                        <path
                          d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm-8 7a8 8 0 1 1 16 0 8 8 0 0 1-16 0Z"
                          fill="currentColor"
                        ></path>
                      )}
                    </svg>
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
        {needRestart && (
          <div
            className="tbg-modal-footer"
            style={{
              border: "none",
              paddingRight: 0,
              paddingLeft: 0,
              paddingBottom: 0,
              paddingTop: "15px",
            }}
          >
            <button
              className="tbg-button-primary"
              onClick={() => window.location.reload()}
            >
              Restart Teams to apply changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
