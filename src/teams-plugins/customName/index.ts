import { Plugin } from "../../interface";

const myId = "8:orgid:9f5e3bbe-0b73-48da-bbce-3210cef4b5d5";

interface CustomNamePlugin extends Plugin {
  logStuff(stuff: string | object): string | object;
  changeUsername(user: { userId?: string; displayName?: string }): void;
}

const customName: CustomNamePlugin = {
  name: "CustomName",
  description: "Change the name of people in Teams.",

  changeUsername(user: { userId?: string; displayName?: string }) {
    if (!user?.userId || !user?.displayName) return user;

    console.log("[CustomName] changeUsername called for user:", user);

    if (user.userId == myId) {
      user.displayName = "My Custom Name";
    }

    console.log("[CustomName] changeUsername returning user:", user);

    return user;
  },

  logStuff(stuff: string | object) {
    console.log("[CustomName] logStuff:", stuff);
    return stuff;
  },

  patches: [
    /*{
      find: '"PersonaInner"',
      replacement: [
        {
          match:
            /(\((\w+)\.userId\)&&\w+&&\w+\?\.IsLivePersonaCardInitialized&&!!\w+,\w+=\w+\(\w+,\w+,\w+,!!\w+\);)/,
          replace: "$1$2=$self.changeUsername($2);",
        },
      ],
    },*/
    /*{
      find: /\(\{title:\w+,highlightText:\w+,ariaTitle:\w+\}\)/,
      replacement: [
        {
          match:
            /(\{title:)(\w+)(,highlightText:\w+,ariaTitle:)(\w+)(\}\)=>\w+\?)/,
          replace: "$1$self.logStuff($2)$3$self.logStuff($4)$5",
        },
      ],
    },*/
    {
      find: /const \w+=\(\{title:\w+,highlightText:\w+,ariaTitle:\w+\}\)/,
      replacement: [
        {
          match:
            /(\(\w+,\{title:)(\w+)(,highlightText:\w+,ariaTitle:)(\w+)(\})/,
          replace: "$1$self.logStuff($2)$3$self.logStuff($4)$5",
        },
      ],
    },
  ],
};

export default customName;
