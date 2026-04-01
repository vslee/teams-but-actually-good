import { Plugin } from "../../interface";
import { IPluginOptionComponentProps, OptionType } from "../../types/types";
import * as React from "react";

function ChannelSelectorComponent({
  setValue,
  value,
  ReactLib,
}: IPluginOptionComponentProps) {
  void ReactLib;
  const plugin = (window as any).__TEAMS_PLUGINS__?.[betterInputBar.name];
  const channels: Array<{ key: string }> = plugin?.availableInputButtons ?? [];
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
      {channels.map(({ key }: { key: string }) => (
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
          {key}
        </label>
      ))}
    </div>
  );
}

const betterInputBar: Plugin = {
  name: "BetterInputBar",
  description: "Remove useless buttons from the input bar.",
  availableInputButtons: [] as Array<{ key: string }>,
  settingsDef: {
    selectedButtons: {
      type: OptionType.COMPONENT,
      component: ChannelSelectorComponent,
      default: [],
      restartNeeded: true,
    },
  },

  filterInputBarItems(inputBarAdditionalCommands: any) {
    if (!inputBarAdditionalCommands) return inputBarAdditionalCommands;
    //console.log(inputBarAdditionalCommands);

    this.availableInputButtons = inputBarAdditionalCommands.map(
      (_item: any, index: number) => ({
        key: String(index + 1),
      }),
    );

    //console.log(this.availableInputButtons);

    const selected: string[] = Array.isArray(this.settings?.selectedButtons)
      ? (this.settings.selectedButtons as string[])
      : [];

    // Show all channels when nothing is explicitly selected
    if (selected.length === 0) return inputBarAdditionalCommands;

    return inputBarAdditionalCommands.filter((_item: any, index: number) => {
      const key = String(index + 1);
      return selected.includes(key);
    });
  },

  logStuff(stuff: any) {
    console.log("[BetterInputBar] logStuff:", stuff);
    return stuff;
  },

  patches: [
    {
      find: "hide-from-overflow",
      replacement: [
        {
          match:
            /(additionalCommands:(\w+),overflowTitle:\w+,showDividers:\w+,showLargerDivider:\w+,showMediumDivider:\w+,start:\w+,variablesMain:\w+,className:\w+,isSmartResponse:\w+,isEditingSideThreaded:\w+\}\)=>\{)/,
          replace: "$1$2=$self.filterInputBarItems($2);",
        },
      ],
    },
    {
      find: '("isAutoOverflow")',
      replacement: [
        {
          match:
            /(\"data-is-visible\":\!\w+,\"aria-hidden\":\w+,getOverflowItems:\w+,items:)(\w+),/,
          replace: "$1$self.logStuff($2),",
        },
      ],
    },
  ],
};

export default betterInputBar;
