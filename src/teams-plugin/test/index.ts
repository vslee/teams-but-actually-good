import { Plugin } from "../../interface";

const TestPlugin: Plugin = {
  name: "ChannelListPatch",
  description: "Test patch for channel list",
  patches: [
    {
      find: /children:\w+,id:\w+,items:\w+,strategy:\w+=\w+/,
      replacement: [
        {
          match:
            /(let\{children:(\w+),id:\w+,items:\w+,strategy:\w+=\w+,disabled:\w+=!1\}=\w+;)/,
          replace:
            '$1console.log("[ChannelListPatch] children.props.children[0] BEFORE:", $2?.props?.children?.[0]?.length);if($2?.props?.children?.[0]&&Array.isArray($2.props.children[0])){$2.props.children[0]=$2.props.children[0].slice(-1);console.log("[ChannelListPatch] children.props.children[0] AFTER:", $2.props.children[0].length);}',
        },
      ],
    },
  ],
};

export default TestPlugin;
