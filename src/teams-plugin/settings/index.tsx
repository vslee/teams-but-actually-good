import { Plugin } from "../../interface";

// Plugin definition without JSX
const SettingsPlugin: Plugin = {
  name: "SettingsInjector",
  description: "Adds custom settings tabs to Teams settings panel",

  // Plugin methods that can be called from patched code
  addNewChildren(elementsProp: any) {
    if (!elementsProp?.children || !Array.isArray(elementsProp.children)) {
      return elementsProp;
    }

    // Check if this is the settings section we want to modify
    if (elementsProp.children[0]?.key !== "general") {
      return elementsProp;
    }

    console.log("[Settings] Found settings children!");

    // Get the template from existing child
    const template = elementsProp.children[0];

    // Create new child by cloning the structure properly
    const newChild = {
      ...template,
      key: "plugin_settings",
      ref: null,
      props: {
        ...template.props,
        category: "plugin_settings",
        isActive: false,
      },
    };

    // DON'T mutate directly! Create new array
    const newChildren = [newChild, ...elementsProp.children];

    // Return modified props object
    return {
      ...elementsProp,
      children: newChildren,
    };
  },

  // Plugin patches
  patches: [
    {
      find: /\{value:\w+,version:\w+,listeners:\[\]\}/,
      replacement: {
        match:
          /(\w+)\.createElement\((\w+),\{value:(\w+)\.current\},(\w+)\.children\)/,
        replace:
          "$1.createElement($2,{value:$3.current},($self.addNewChildren($4)||$4).children)",
      },
    },
  ],
};

export default SettingsPlugin;
