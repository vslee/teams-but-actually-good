import React from "react";
import syncSVGURL from "../../svgs/sync.svg";
// import { injectNotificationModal } from "../../utils/notifications";

export default function Sync({ ReactLib }: { ReactLib: typeof React }) {
  void ReactLib;
  /*const handleTestNotification = () => {
    injectNotificationModal(
      "Test Notification",
      "This is a test notifiation that will last for 5 seconds",
      { duration: 5000 },
    );
  };*/

  const handleUploadSettings = () => {
    // TODO implement the upload settings logic
    window.open("http://localhost:3001/v1/sync/upload", "_blank")?.focus();
  };

  /** @jsx ReactLib.createElement */
  return (
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
              .open("http://localhost:3001/v1/auth/discord", "_blank")
              ?.focus()
          }
        >
          Login with Discord
        </button>
        <button
          className="tbg-button-secondary"
          onClick={() =>
            window
              .open("http://localhost:3001/v1/isLoggedIn", "_blank")
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
          onClick={() =>
            window
              .open("http://localhost:3001/v1/isLoggedIn", "_blank")
              ?.focus()
          }
        >
          Download Settings
        </button>
      </div>
      <span className="tbg-setting-restart">
        If you've any question on how the syncing works, please refer to the{" "}
        <a
          href="https://docs.teamsbutactuallygood.dev/TODO"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "underline", color: "inherit" }}
        >
          documentation
        </a>
        .
      </span>
    </div>
  );
}
