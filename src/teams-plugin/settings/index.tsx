import { Plugin } from "../../interface";

const SettingsPlugin: Plugin = {
  name: "SettingsInjector",
  description: "Adds custom settings tabs to Teams settings panel",

  addNewChildren(elementsProp: any) {
    if (!elementsProp?.children || !Array.isArray(elementsProp.children)) {
      return elementsProp;
    }

    if (elementsProp.children[0]?.key !== "general") {
      return elementsProp;
    }

    const template = elementsProp.children[0];

    const newChild = {
      ...template,
      key: "plugin_settings",
      ref: null,
      props: {
        ...template.props,
        category: "Plugin Settings",
        isActive: false,
      },
    };

    const newChildren = [newChild, ...elementsProp.children];

    return {
      ...elementsProp,
      children: newChildren,
    };
  },

  changeName(value: string) {
    console.log("[Settings] Changing name for value:", value);
    if (value === "plugin_settings") {
      return "Teams But Good Settings";
    }
    return value;
  },

  addCustomContent(React: any) {
    console.log("[Settings] Adding custom content to settings tab");
    // Now we can use JSX! Much cleaner :)
    return (
      <div style={{ padding: "20px" }}>
        <h2>Custom Settings</h2>
        <div>Custom content goes here</div>
        <button onClick={() => alert("Clicked!")}>Test Button</button>
        <input type="text" />
      </div>
    );
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
    {
      find: "category content goes here",
      replacement: {
        match:
          /=>\(0,\w+\.Y\)\("div",\{children:`\$\{\w+\} category content goes here`\}\),(\w+=(\w+)\.memo)/,
        replace: "=>$self.addCustomContent($2),$1",
      },
    },
    // Allow you to change the displayed name of the settings tab
    // by modifying the local files with the translation key
    /*{
      find: /app_title:"{{title}}",/,
      replacement: {
        match: /(app_title:"{{title}}",)/,
        replace: '$1plugin_settings:"Plugin Settings",',
      },
    },*/
  ],
};

export default SettingsPlugin;
