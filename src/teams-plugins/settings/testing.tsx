import React from "react";
import testingUrl from "../../svgs/testing.svg";
import { injectNotificationModal } from "../../utils/notifications";

export default function Testing({ ReactLib }: { ReactLib: typeof React }) {
  void ReactLib;
  const handleTestNotification = () => {
    injectNotificationModal(
      "Test Notification",
      "This is a test notifiation that will last for 5 seconds",
      { duration: 5000 },
    );
  };

  /** @jsx ReactLib.createElement */
  return (
    <div className="tbg-container">
      <div className="tbg-default-display-flex">
        <img
          src={testingUrl}
          style={{
            height: "17px",
            filter: "brightness(0) invert(1)",
          }}
          aria-hidden="true"
        />
        <span>Testing</span>
      </div>
      <div className="tbg-plugin-container">
        <div className="tbg-plugin-header">
          <span className="tbg-plugin-name">Demo Notification</span>
          <div className="tbg-plugin-controls">
            <button
              className="tbg-button-secondary"
              onClick={handleTestNotification}
            >
              Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
