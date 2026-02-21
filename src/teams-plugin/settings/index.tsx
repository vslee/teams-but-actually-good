import { Plugin } from "../../interface";

// Plugin definition without JSX
const SettingsPlugin: Plugin = {
  name: "SettingsInjector",

  // Plugin methods that can be called from patched code
  addNewChildren(elementsProp: any) {
    console.log("[Settings] Children received:", elementsProp);

    // You can modify the children here
    if (elementsProp?.children) {
      console.log("[Settings] Children content:", elementsProp.children);

      // Example: You could manipulate the children array here
      // if (Array.isArray(elementsProp.children)) {
      //   elementsProp.children.push(someNewElement);
      // }
    }

    return elementsProp;
  },

  // Plugin patches
  patches: [
    {
      name: "Settings",
      plugin: "SettingsInjector", // Must match the plugin name above
      find: "'--fui-Button__icon--spacing'",
      replace: [
        {
          match:
            /(\w+.createElement\(\w+,{value:\w+.current},(\w+).children\))/,
          replace: "$self.addNewChildren($2);$1",
        },
      ],
    },
  ],
};

export default SettingsPlugin;
