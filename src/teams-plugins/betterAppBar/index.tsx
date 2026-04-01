import { Plugin } from "../../interface";
import { IPluginOptionComponentProps, OptionType } from "../../types/types";
import * as React from "react";

function ChannelSelectorComponent({
  setValue,
  value,
  ReactLib,
}: IPluginOptionComponentProps) {
  void ReactLib;
  const plugin = (window as any).__TEAMS_PLUGINS__?.[betterAppBar.name];
  const channels: Array<{ key: string; label: string }> =
    plugin?.availableChannels ?? [];
  const selected: string[] = Array.isArray(value) ? value : [];

  if (channels.length === 0) {
    /** @jsx ReactLib.createElement */
    return (
      <p className="tbg-setting-description">
        No channels detected yet, enable the plugin first.
      </p>
    );
  }

  /** @jsx ReactLib.createElement */
  return (
    <div className="tbg-channel-selector">
      {channels.map(({ key, label }: { key: string; label: string }) => (
        <label
          key={key}
          className="tbg-channel-option"
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          <input
            type="checkbox"
            checked={selected.length === 0 || selected.includes(key)}
            onChange={() => {
              const next = selected.includes(key)
                ? selected.filter((k: string) => k !== key)
                : [...selected, key];
              setValue(next);
            }}
          />{" "}
          {label}
        </label>
      ))}
    </div>
  );
}

const betterAppBar: Plugin = {
  name: "BetterAppBar",
  description: "Shows only selected channels in the channel list.",
  availableChannels: [] as Array<{ key: string; label: string }>,
  settingsDef: {
    selectedChannels: {
      type: OptionType.COMPONENT,
      component: ChannelSelectorComponent,
      default: [],
      restartNeeded: true,
    },
  },

  filterChannels(items: any[]): any[] {
    // Snapshot available channels for the settings UI
    this.availableChannels = items.map((item: any) => ({
      key: String(item?.key),
      label: "", // no label is proved here, channel365AppInfo will update the label later when we have the app info
    }));

    const selected: string[] = Array.isArray(this.settings?.selectedChannels)
      ? (this.settings.selectedChannels as string[])
      : [];

    // Show all channels when nothing is explicitly selected
    if (selected.length === 0) return items;

    return items.filter((item: any) => {
      const key = String(item?.key);
      return selected.includes(key);
    });
  },

  channel365AppInfo(appInfo: any) {
    // console.log("[BetterAppBar] channel365AppInfo:", appInfo);
    // console.log(appInfo.id, appInfo.name);
    // Update the app name in the available channels list for better display in settings
    this.availableChannels = this.availableChannels.map(
      (channel: { key: string; label: string }) => {
        if (channel.key === appInfo.id) {
          return {
            key: channel.key,
            label: appInfo.name,
          };
        }
        return channel;
      },
    );
    return appInfo;
  },

  patches: [
    {
      find: /children:\w+,id:\w+,items:\w+,strategy:\w+=\w+/,
      replacement: [
        {
          match:
            /(let\{children:(\w+),id:\w+,items:\w+,strategy:\w+=\w+,disabled:\w+=!1\}=\w+;)/,
          replace:
            "$1if($2?.props?.children?.[0]&&Array.isArray($2.props.children[0])){$2.props.children[0]=$self.filterChannels($2.props.children[0]);}",
        },
      ],
    },
    {
      find: /===\"ThreeColumnView\"\?\w+\.button/,
      replacement: [
        {
          match:
            /(m365App:(\w+),getAccessibleNameWithShortcutText:\w+,onPinStateChange:\w+,onClicked:\w+,onContextMenu:\w+,onDidMount:\w+,linkedEntity:\w+,dragDropEnabled:\w+,enableMicaV2DesktopStyles:\w+,enableMicaV2WebStyles:\w+,enableMercuryDesignStyles:\w+,backgroundShade:\w+,isListItem:\w+,isUsingCustomThemeColor:\w+,enableVisualRefreshStyles:\w+,enableAppBarPeek:\w+,onMove:\w+,hideLabel:\w+=!1,enableListLayout:\w+,enableAgenticSquircleStyle:\w+,listSize:\w+\},\w+\)=>\{)/,
          replace: "$1$self.channel365AppInfo($2);",
        },
      ],
    },
  ],
};

export default betterAppBar;
