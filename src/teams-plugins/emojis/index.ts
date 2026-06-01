import { Plugin } from "../../interface";

interface customEmojisPlugin extends Plugin {
  logStuff(stuff: string | object): string | object;
}

const customEmojis: customEmojisPlugin = {
  name: "CustomEmojis",
  description: "Add custom emojis to your chat.",

  logStuff(stuff: string | object) {
    if (stuff.variables?.message?.content) {
      console.log(
        "[CustomEmojis] Original message content:",
        stuff.variables.message.content,
      );
      stuff.variables.message.content = stuff.variables.message.content.replace(
        ":nods:",
        '<span contenteditable="false" itemscope><img itemscope src="https://swisscom-my.sharepoint.com/personal/leo_teixeira_swisscom_com/Documents/Fichiers%20de%20conversation%20Microsoft%20Teams/IMG_1035.png" title="En colèrebombo" alt="bombo cat" style="width:20px;height:20px;"></span>',
      );
      console.log(
        "[CustomEmojis] Edited message content:",
        stuff.variables.message.content,
      );
    }
    return stuff;
  },

  patches: [
    {
      find: "},this.sendMessage=",
      replacement: {
        match:
          /(this.sendMessage=\w+=>\w+\({requestId:\w+\.requestId,rendererId:\w+\.rendererId,windowId:\w+\.windowId,payload:)(\w+\.request),/,
        replace: "$1$self.logStuff($2),",
      },
    },
  ],
};

export default customEmojis;
