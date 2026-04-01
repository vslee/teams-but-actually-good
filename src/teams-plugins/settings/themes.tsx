import React from "react";
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import windowUrl from "../../svgs/window.svg";
import { getMainSetting, setMainSetting } from "../../utils/storage";
import { themeRegistry } from "../../interface";

export default function Themes({ ReactLib }: { ReactLib: typeof React }) {
  void ReactLib;
  const [needRestart, setNeedRestart] = ReactLib.useState(false);
  const [selectedTheme, setSelectedTheme] = ReactLib.useState<string | null>(
    null,
  );
  const editorHostRef = ReactLib.useRef<HTMLDivElement | null>(null);
  const editorViewRef = ReactLib.useRef<EditorView | null>(null);
  const defaultThemeName = "Default (Teams)";

  ReactLib.useEffect(() => {
    getMainSetting("theme").then((saved) => {
      if (saved && themeRegistry[saved]) {
        setSelectedTheme(saved);
        themeRegistry[saved].enable = true;
      }
    });
  }, []);

  ReactLib.useEffect(() => {
    if (selectedTheme !== "custom") return;

    let active = true;
    const raf = requestAnimationFrame(() => {
      if (!active || !editorHostRef.current) return;

      let initialDoc = `/**
 * @name Test Name
 * @author LeonimusT
 * @version 0.0.1
 * @description Test description.
 * @source https://github.com
 * @website https://leonimust.com
 */

.fui-FluentProvider,
[class*="fui-FluentProvider"] {
  --backgroundCanvas: #1cbf52 !important;
}

#ms-searchux-input {
  background-color: #ffffff !important;
}`;
      try {
        const raw = localStorage.getItem("teams-but-good:main");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            typeof parsed.customCss === "string" &&
            parsed.customCss.length > 0
          ) {
            initialDoc = parsed.customCss;
          }
        }
      } catch {
        /* ignore parse errors */
      }

      try {
        const state = EditorState.create({
          doc: initialDoc,
          extensions: [
            basicSetup,
            css(),
            oneDark,
            EditorView.cspNonce.of((window as any).__tbg_csp_nonce ?? ""),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                setMainSetting("customCss", update.state.doc.toString());
              }
            }),
            EditorView.theme({
              "&": { height: "400px" },
              ".cm-scroller": { overflow: "auto" },
            }),
          ],
        });

        editorViewRef.current = new EditorView({
          state,
          parent: editorHostRef.current,
        });
      } catch (err) {
        console.error("[tbg] CodeMirror init failed:", err);
      }
    });

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      editorViewRef.current?.destroy();
      editorViewRef.current = null;
    };
  }, [selectedTheme]);

  function handleThemeChange(themeName: string | null) {
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
          <div className="tbg-plugins-grid" key="theme-default">
            <label
              htmlFor="theme-radio-default"
              className="tbg-box-basic"
              style={{
                minHeight: 0,
                cursor: "pointer",
                userSelect: "none",
                display: "block",
              }}
            >
              <div className="tbg-plugin-header">
                <span className="tbg-plugin-name">{defaultThemeName}</span>
                <div className="tbg-plugin-controls">
                  <input
                    id="theme-radio-default"
                    type="radio"
                    name="theme"
                    value=""
                    checked={selectedTheme === null}
                    onChange={() => handleThemeChange(null)}
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
                    {selectedTheme === null ? (
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
          <div className="tbg-plugins-grid" key="custom-themes">
            <label
              htmlFor="theme-radio-custom"
              className="tbg-box-basic"
              style={{
                minHeight: 0,
                cursor: "pointer",
                userSelect: "none",
                display: "block",
              }}
            >
              <div className="tbg-plugin-header">
                <span className="tbg-plugin-name">Custom Themes</span>
                <div className="tbg-plugin-controls">
                  <input
                    id="theme-radio-custom"
                    type="radio"
                    name="theme"
                    value="custom"
                    checked={selectedTheme === "custom"}
                    onChange={() => handleThemeChange("custom")}
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
                    {selectedTheme === "custom" ? (
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
        {selectedTheme === "custom" && (
          <div
            ref={editorHostRef}
            style={{
              marginTop: "12px",
              border: "1px solid #3c3c3c",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          />
        )}
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
