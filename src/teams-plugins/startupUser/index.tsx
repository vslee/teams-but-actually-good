import { Plugin } from "../../interface";
import { IPluginOptionComponentProps, OptionType } from "../../types/types";
import * as React from "react";

function UserSelectorComponent({
  setValue,
  value,
  ReactLib,
}: IPluginOptionComponentProps) {
  void ReactLib;
  const plugin = (window as any).__TEAMS_PLUGINS__?.[startupUserPlugin.name];
  const users: Array<{ key: string; name: string }> =
    plugin?.availableInputButtons ?? [];

  if (users.length === 0) {
    /** @jsx ReactLib.createElement */
    return (
      <p className="tbg-setting-description">
        No users detected yet, enable the plugin first.
      </p>
    );
  }

  /** @jsx ReactLib.createElement */
  return (
    <div>
      {users.map(({ key, name }: { key: string; name: string }) => (
        <div className="tbg-plugins-grid" key={key} style={{ padding: "5px" }}>
          <label
            htmlFor={`user-radio-${key}`}
            className="tbg-box-basic"
            style={{
              minHeight: 0,
              cursor: "pointer",
              userSelect: "none",
              display: "block",
            }}
          >
            <div className="tbg-plugin-header">
              <span className="tbg-plugin-name">{name}</span>
              <div className="tbg-plugin-controls">
                <input
                  id={`user-radio-${key}`}
                  type="radio"
                  name="startup-user"
                  value={key}
                  checked={value === key}
                  onChange={() => setValue(key)}
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
                  {value === key ? (
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
  );
}

function setStartupUserInLocalStorage() {
  let selectedUserId: string | null = null;
  try {
    const pluginSettings = localStorage.getItem(
      "teams-but-good:plugin:StartupUser",
    );
    if (pluginSettings) {
      const parsed = JSON.parse(pluginSettings);
      selectedUserId = parsed?.selectedButtons ?? null;
    }
  } catch {
    /* ignore parse errors */
  }

  if (!selectedUserId) {
    console.warn("[StartupUser] No user selected, skipping.");
    return;
  }

  const key = Object.keys(localStorage).find(
    (k) =>
      k.startsWith("tmp.react-web-client.") &&
      k.includes("-appActiveEntitiesHistory-"),
  );

  if (!key) {
    console.warn("[StartupUser] No user history key found in localStorage.");
    return;
  }

  let userHistory = key ? JSON.parse(localStorage.getItem(key) || "{}") : null;

  if (!userHistory) {
    console.warn("[StartupUser] No user history found in localStorage.");
    return;
  }

  try {
    userHistory.headerEntity.id = selectedUserId;
    userHistory.mainEntity.id = selectedUserId;
    localStorage.setItem(key, JSON.stringify(userHistory));
  } catch (error) {
    console.error("[StartupUser] Error updating user history:", error);
  }
}

const startupUserPlugin: Plugin = {
  name: "StartupUser",
  description:
    "Allow you to choose which user chat Teams will open on startup.",
  availableInputButtons: [] as Array<{ key: string; name: string }>,
  settingsDef: {
    selectedButtons: {
      type: OptionType.COMPONENT,
      component: UserSelectorComponent,
      default: [],
      restartNeeded: true,
    },
  },

  saveUsersIdAndName(conversation: any) {
    console.log(conversation);
    console.log(conversation);
    if (!conversation.id || !conversation.title) {
      return conversation;
    }
    const rawId: string = conversation.id;
    const id = rawId.includes("|")
      ? rawId.slice(rawId.indexOf("|") + 1)
      : rawId;
    console.log(id);
    this.availableInputButtons.push({
      key: id,
      name: conversation.title,
    });

    return conversation;
  },

  patches: [
    /*{
      find: '=["conversation:remove","conversation:move-to"]',
      replacement: [
        {
          match: /(\(\{children:(\w+),value:\w+\}\)=>\{)/,
          replace: "$1$2=$self.saveUserIds($2);",
        },
      ],
    },*/
    {
      find: /relationship:\"inaccessible\"\,showDelay:\w+\.channel/,
      replacement: [
        {
          match: /(\w+\.useFragment\)\(\w+,)(\w+.conversation)\)/,
          replace: "$1$self.saveUsersIdAndName($2))",
        },
      ],
    },
  ],
  mainEntry: setStartupUserInLocalStorage,
};

export default startupUserPlugin;
