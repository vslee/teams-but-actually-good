import { Plugin } from "../../interface";

const myId = "8:orgid:9f5e3bbe-0b73-48da-bbce-3210cef4b5d5";
const newName = "Dojian";

interface CustomNamePlugin extends Plugin {
  logStuff(stuff: string | object): string | object;
}

type ConversationRecord = {
  chatTitle: {
    avatarUsersInfo: {
      displayName: string;
      mri: string;
    }[];
    shortTitle: string;
  };
};

async function editNames() {
  const allDbs = await indexedDB.databases();
  const target = allDbs.find((db) => {
    if (!db.name) return false;
    return db.name.startsWith("Teams:conversation-manager:react-web-client:");
  });

  if (!target) {
    console.error("DB introuvable");
    return;
  }

  const db: IDBDatabase = await new Promise((resolve, reject) => {
    const req = indexedDB.open(target.name as string, target.version);
    req.onsuccess = (e) => {
      resolve((e.target as IDBOpenDBRequest).result);
    };
    req.onerror = (e) => {
      reject((e.target as IDBOpenDBRequest).error);
    };
  });

  const tx = db.transaction("conversations", "readwrite");
  const store = tx.objectStore("conversations");
  const records: ConversationRecord[] = await new Promise(
    (res) =>
      (store.getAll().onsuccess = (e) => res((e.target as IDBRequest).result)),
  );

  for (const record of records) {
    if (!record?.chatTitle?.avatarUsersInfo?.[0]?.displayName) continue;
    if (record.chatTitle.avatarUsersInfo[0].mri !== myId) continue;
    record.chatTitle.avatarUsersInfo[0].displayName = newName;
    record.chatTitle.shortTitle = newName;
    store.put(record);
  }

  await new Promise((res) => (tx.oncomplete = res));
  console.log("displayName mis à jour !");
  db.close();
}

const customName: CustomNamePlugin = {
  name: "CustomName",
  description: "Change the name of people in Teams.",

  logStuff(stuff: string | object) {
    console.log("[CustomName] logStuff:", stuff);
    return stuff;
  },

  mainEntry: editNames,

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
    },
    {
      find: /const \w+=\(\{title:\w+,highlightText:\w+,ariaTitle:\w+\}\)/,
      replacement: [
        {
          match:
            /(\(\w+,\{title:)(\w+)(,highlightText:\w+,ariaTitle:)(\w+)(\})/,
          replace: "$1$self.logStuff($2)$3$self.logStuff($4)$5",
        },
      ],
    },*/
  ],
};

export default customName;
