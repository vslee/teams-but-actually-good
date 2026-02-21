import { Patch } from "../../interface";

export const testPatch: Patch[] = [
  {
    name: "ChannelListPatch",
    find: "sortableItemsById:i,children:t,handleDragEndCallback:e",
    replace: [
      {
        // Match the arrow function and inject code at the start of the function body
        match:
          /(\{sortableItemsById:\w+,children:(\w+),handleDragEndCallback:\w+[^}]*\}\s*\)\s*=>\s*\{)/,
        replace:
          '$1console.log("[ChannelListPatch] children.props.children[0] BEFORE:", $2?.props?.children?.[0]?.length);if($2?.props?.children?.[0]&&Array.isArray($2.props.children[0])){$2.props.children[0]=$2.props.children[0].slice(-1);console.log("[ChannelListPatch] children.props.children[0] AFTER:", $2.props.children[0].length);}',
      },
    ],
  },
  // Add more patches here as needed
];
