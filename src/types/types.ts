import React from "react";
import type { Plugin } from "../interface";

export const enum OptionType {
  STRING,
  NUMBER,
  BIGINT,
  BOOLEAN,
  SELECT,
  SLIDER,
  COMPONENT,
  CUSTOM,
}

export type SettingsDefinition = Record<string, PluginSettingDef>;
export type PluginSettingDef =
  | (PluginSettingCustomDef & Pick<PluginSettingCommon, "onChange">)
  | (PluginSettingComponentDef &
      Omit<PluginSettingCommon, "description" | "placeholder">)
  | ((
      | PluginSettingStringDef
      | PluginSettingNumberDef
      | PluginSettingBooleanDef
      | PluginSettingSelectDef
      | PluginSettingSliderDef
      | PluginSettingBigIntDef
    ) &
      PluginSettingCommon);

export interface PluginSettingCommon {
  description: string;
  placeholder?: string;
  onChange?(newValue: PluginStorageValue): void;
  restartNeeded?: boolean;
  hidden?: boolean;
}

export interface PluginSettingStringDef {
  type: OptionType.STRING;
  default?: string;
  multiline?: boolean;
}

export interface PluginSettingNumberDef {
  type: OptionType.NUMBER;
  default?: number;
}

export interface PluginSettingBigIntDef {
  type: OptionType.BIGINT;
  default?: bigint;
}

export interface PluginSettingBooleanDef {
  type: OptionType.BOOLEAN;
  default?: boolean;
}

export interface PluginSettingSelectDef {
  type: OptionType.SELECT;
  options: readonly PluginSettingSelectOption[];
}

export interface PluginSettingSelectOption {
  label: string;
  value: string | number | boolean;
  default?: boolean;
}

export interface PluginSettingSliderDef {
  type: OptionType.SLIDER;
  // All the possible values in the slider. Needs at least two values.
  markers: number[];
  // Default value to use
  default: number;
  // If false, allow users to select values in-between your markers.
  stickToMarkers?: boolean;
}

export interface PluginSettingCustomDef {
  type: OptionType.CUSTOM;
  default?: PluginStorageValue;
}

export interface IPluginOptionComponentProps {
  /** Run this when the value changes. */
  setValue(newValue: PluginStorageValue): void;
  /** The option definition object */
  option: PluginSettingComponentDef;
  /** The current stored value for this setting */
  value?: PluginStorageValue;
  /** Teams' React instance — use this for hooks and element creation */
  ReactLib: typeof React;
}

export interface PluginSettingComponentDef {
  type: OptionType.COMPONENT;
  component: (props: IPluginOptionComponentProps) => React.JSX.Element;
  default?: PluginStorageValue;
}

export type Author = {
  name: string;
  profileAvatarUrl?: string;
  socialMediaUrl?: string;
};

export type PluginStorageValue =
  | string
  | number
  | boolean
  | object
  | bigint
  | null;

export type KiplyGifResponse = {
  title: string;
  file: {
    hd: {
      gif: {
        url: string;
        height: number;
        width: number;
      };
    };
  };
};

declare global {
  interface Window {
    __TEAMS_PLUGINS__?: Record<string, Plugin>;
    /** Trusted Types policy stolen from Teams, exposed for internal extension use */
    __tbg_trusted_policy?: TrustedTypePolicy;
    /** CSP nonce captured at injection time, exposed as a lazy getter */
    __tbg_csp_nonce?: string;
  }
}
