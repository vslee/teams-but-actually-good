import React from "react";
import syncSVGURL from "../../svgs/sync.svg";
import { getAllPluginSettings } from "../../utils/storage";
import { basicSetup, EditorView } from "codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { setPluginSettings, setMainSettings } from "../../utils/storage";
import { PluginStorageValue } from "../../types/types";

const BASE_URL = "https://api.teamsbutactuallygood.dev";
const API_VERSION = "v1";

function DownloadModal({
  ReactLib,
  onClose,
}: {
  ReactLib: typeof React;
  onClose: () => void;
}) {
  void ReactLib;

  const [needRestart, setNeedRestart] = ReactLib.useState(false);
  const [pluginData, setPluginData] = ReactLib.useState<Record<
    string,
    Record<string, PluginStorageValue>
  > | null>(null);
  const [errorMessage, setErrorMessage] = ReactLib.useState<string | null>(
    null,
  );
  const editorHostRef = ReactLib.useRef<HTMLDivElement | null>(null);
  const editorViewRef = ReactLib.useRef<EditorView | null>(null);

  ReactLib.useEffect(() => {
    const raf = requestAnimationFrame(async () => {
      if (!editorHostRef.current) return;

      let initialDoc = `{"main": {"firstTimeInjection": false}}`;

      try {
        editorViewRef.current = new EditorView({
          doc: initialDoc,
          extensions: [
            basicSetup,
            json(),
            oneDark,
            EditorView.cspNonce.of(window.__tbg_csp_nonce ?? ""),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                try {
                  const pluginData = JSON.parse(update.state.doc.toString());

                  if (!pluginData || typeof pluginData !== "object") {
                    return setErrorMessage(
                      "Invalid JSON structure. Expected an object.",
                    );
                  }

                  if (!pluginData.data) {
                    return setErrorMessage("Missing 'data' property in JSON.");
                  }

                  setPluginData(pluginData.data);
                  setNeedRestart(true);
                } catch (error) {
                  console.error("Invalid JSON:", error);
                  setErrorMessage("Invalid JSON structure.");
                }
              }
            }),
            EditorView.theme({
              "&": { height: "100px" },
              ".cm-scroller": { overflow: "auto" },
            }),
          ],
          parent: editorHostRef.current,
        });
      } catch (err) {
        console.error("Failed to initialize CodeMirror editor:", err);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      editorViewRef.current?.destroy();
      editorViewRef.current = null;
    };
  }, []);

  const handleSave = () => {
    try {
      for (const [key, value] of Object.entries(pluginData ?? {})) {
        if (key === "main") {
          setMainSettings(value);
        } else {
          setPluginSettings(key, value);
        }
      }

      window.location.reload();
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  /** @jsx ReactLib.createElement */
  return (
    <div className="tbg-modal-backdrop">
      <div className="tbg-modal">
        <div className="tbg-modal-header">
          <span className="tbg-modal-title">Download Settings</span>
          <button
            className="tbg-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </div>
        <h2 className="tbg-modal-subtitle">
          Click on "Download Settings", then copy the JSON from the newly opened
          page and paste it in the editor
        </h2>
        <div className="tbg-modal-body">
          {errorMessage && (
            <div className="tbg-error-message">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          <div
            ref={editorHostRef}
            style={{
              marginTop: "12px",
              border: "1px solid #3c3c3c",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          />
          <button
            className="tbg-button-primary"
            onClick={() =>
              window
                .open(`${BASE_URL}/${API_VERSION}/sync/download`, "_blank")
                ?.focus()
            }
          >
            Download Settings
          </button>
        </div>
        <div className="tbg-modal-footer">
          {needRestart ? (
            <button className="tbg-button-primary" onClick={handleSave}>
              Restart Teams to apply changes
            </button>
          ) : (
            <button className="tbg-button-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sync({ ReactLib }: { ReactLib: typeof React }) {
  void ReactLib;
  const [showDownloadModal, setShowDownloadModal] = ReactLib.useState(false);

  const handleUploadSettings = async () => {
    const confirm = window.confirm(
      "Uploading settings will overwrite any existing settings in the cloud with your current local settings. Are you sure you want to proceed?",
    );

    if (!confirm) return;

    const allSettings = await getAllPluginSettings();

    window
      .open(
        `${BASE_URL}/${API_VERSION}/sync/upload?data=${encodeURIComponent(JSON.stringify(allSettings))}`,
        "_blank",
      )
      ?.focus();
  };

  /** @jsx ReactLib.createElement */
  return (
    <div>
      <div className="tbg-container">
        <div className="tbg-default-display-flex">
          <img
            src={syncSVGURL}
            style={{
              height: "17px",
              filter: "brightness(0) invert(1)",
            }}
            aria-hidden="true"
          />
          <span>Sync</span>
        </div>
        <div className="tbg-plugin-container">
          <button
            className="tbg-button-primary"
            onClick={() =>
              window
                .open(`${BASE_URL}/${API_VERSION}/auth/discord`, "_blank")
                ?.focus()
            }
          >
            Login with Discord
          </button>
          <button
            className="tbg-button-secondary"
            onClick={() =>
              window
                .open(`${BASE_URL}/${API_VERSION}/isLoggedIn`, "_blank")
                ?.focus()
            }
          >
            Test Login
          </button>
        </div>
        <div className="tbg-plugin-container">
          <button className="tbg-button-primary" onClick={handleUploadSettings}>
            Upload Settings
          </button>
          <button
            className="tbg-button-secondary"
            onClick={() => setShowDownloadModal(true)}
          >
            Open Download Settings Modal
          </button>
        </div>
        <span className="tbg-setting-restart">
          If you've any question on how the syncing works, please refer to the{" "}
          <a
            href="https://docs.teamsbutactuallygood.dev/sync"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline", color: "inherit" }}
          >
            documentation
          </a>
          .
        </span>
      </div>
      {showDownloadModal && (
        <DownloadModal
          ReactLib={ReactLib}
          onClose={() => setShowDownloadModal(false)}
        />
      )}
    </div>
  );
}
