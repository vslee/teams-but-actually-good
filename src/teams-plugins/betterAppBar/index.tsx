import { Plugin } from "../../interface";
import { IPluginOptionComponentProps, OptionType } from "../../types/types";
import * as React from "react";

function ChannelSelectorComponent({
  setValue,
  value,
  ReactLib,
}: IPluginOptionComponentProps) {
  void ReactLib;
  const plugin = window.__TEAMS_PLUGINS__?.[betterAppBar.name];
  const channels: Array<{ key: string; name: string }> =
    plugin?.availableChannels ?? [];
  const selected: string[] =
    Array.isArray(value) && value.length > 0
      ? value
      : channels.map((c: { key: string; name: string }) => c.key);

  if (channels.length === 0) {
    /** @jsx ReactLib.createElement */
    return (
      <p className="tbg-setting-description">
        No channels detected yet, enable the plugin first.
      </p>
    );
  }

  console.log(channels);

  /** @jsx ReactLib.createElement */
  return (
    <div className="tbg-channel-selector">
      {channels.map(({ key, name }: { key: string; name: string }) => (
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
            checked={selected.includes(key)}
            onChange={() => {
              const next = selected.includes(key)
                ? selected.filter((k: string) => k !== key)
                : [...selected, key];
              setValue(next);
            }}
          />{" "}
          {name}
        </label>
      ))}
    </div>
  );
}

const betterAppBar: Plugin = {
  name: "BetterAppBar",
  description: "Shows only selected channels in the channel list.",
  availableChannels: [] as Array<{ key: string; name: string }>,
  settingsDef: {
    selectedChannels: {
      type: OptionType.COMPONENT,
      component: ChannelSelectorComponent,
      default: [],
      restartNeeded: true,
    },
  },

  filterChannels(items: { key: string }[]) {
    const selected: string[] = Array.isArray(this.settings?.selectedChannels)
      ? (this.settings.selectedChannels as string[])
      : [];

    // Show all channels when nothing is explicitly selected
    if (selected.length === 0) return items;

    return items.filter((item: { key: string }) => {
      const key = String(item?.key);
      return selected.includes(key);
    });
  },

  saveAppInfo(children: {
    props?: {
      children?: Array<
        Array<{
          props?: {
            children?: {
              props?: {
                m365App?: {
                  id?: string;
                  name?: string;
                };
              };
            };
          };
        }>
      >;
    };
  }) {
    if (
      !children.props?.children?.[0]?.[0]?.props?.children?.props?.m365App?.id
    ) {
      return children;
    }

    const appChildrens = children.props.children[0];

    for (const child of appChildrens) {
      const m365App = child?.props?.children?.props?.m365App;
      const key = String(m365App?.id ?? "");
      if (!this.availableChannels.some((c: { key: string }) => c.key === key)) {
        this.availableChannels.push({ key, name: m365App?.name ?? "" });
      }
    }
  },

  patches: [
    {
      find: /children:\w+,id:\w+,items:\w+,strategy:\w+=\w+/,
      replacement: [
        {
          match:
            /(let\{children:(\w+),id:\w+,items:\w+,strategy:\w+=\w+,disabled:\w+=!1\}=\w+;)/,
          replace:
            "$1$self.saveAppInfo($2);if($2?.props?.children?.[0]&&Array.isArray($2.props.children[0])){$2.props.children[0]=$self.filterChannels($2.props.children[0]);}",
        },
      ],
    },
  ],
};

export default betterAppBar;
