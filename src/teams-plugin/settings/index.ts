import { Plugin } from "../../interface";

// Plugin definition without JSX
const SettingsPlugin: Plugin = {
  name: "SettingsInjector",

  // Plugin methods that can be called from patched code
  addNewChildren(elementsProp: any, React: any) {
    if (!elementsProp?.children || !Array.isArray(elementsProp.children)) {
      return elementsProp;
    }

    // Check if this is the settings section we want to modify
    if (elementsProp.children[0]?.key !== "general") {
      return elementsProp;
    }

    // Get the component type from an existing child to use as a template
    const firstChild = elementsProp.children[0];
    const MemoizedComponent = firstChild?.type;
    const InnerComponent = MemoizedComponent?.type; // Get the actual component from memo wrapper

    if (!InnerComponent) {
      console.error("[Settings] Could not find component type");
      return elementsProp;
    }

    // Create a new settings item
    // You can either create a memoized component or a regular one
    const newChild = React.createElement(InnerComponent, {
      category: "general",
      isActive: false,
      key: "general",
    });

    // Wrap in memo like the others (optional, but matches their pattern)
    const memoizedChild = React.memo
      ? {
          $$typeof: MemoizedComponent.$$typeof,
          type: { type: {}, compare: null },
          key: "general",
          props: {
            category: "general",
            isActive: false,
          },
        }
      : newChild;

    // Add the new child to the array
    elementsProp.children = [memoizedChild, ...elementsProp.children];

    console.log("[Settings] ", elementsProp.children);

    return elementsProp;
  },

  // Plugin patches
  patches: [
    {
      name: "Settings",
      plugin: "SettingsInjector", // Must match the plugin name above
      // Matches the unique object structure: {value: i, version: M, listeners: []}
      find: /\{value:\w+,version:\w+,listeners:\[\]\}/,
      replace: [
        {
          match:
            /(\w+)\.createElement\((\w+),\{value:(\w+)\.current\},(\w+)\.children\)/,
          replace:
            "$self.addNewChildren($4,$1),$1.createElement($2,{value:$3.current},$4.children)",
        },
      ],
    },
  ],
};

export default SettingsPlugin;
