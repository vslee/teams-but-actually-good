import { Plugin } from "../../interface";

const TestPlugin: Plugin = {
  name: "ChannelListPatch",
  description: "Test patch for channel list",
  patches: [
    {
      find: "sortableItemsById:i,children:t,handleDragEndCallback:e",
      replacement: [
        {
          match:
            /(\{sortableItemsById:\w+,children:(\w+),handleDragEndCallback:\w+[^}]*\}\s*\)\s*=>\s*\{)/,
          replace:
            '$1console.log("[ChannelListPatch] children.props.children[0] BEFORE:", $2?.props?.children?.[0]?.length);if($2?.props?.children?.[0]&&Array.isArray($2.props.children[0])){$2.props.children[0]=$2.props.children[0].slice(-1);console.log("[ChannelListPatch] children.props.children[0] AFTER:", $2.props.children[0].length);}',
        },
      ],
    },
  ],
};

export default TestPlugin;
