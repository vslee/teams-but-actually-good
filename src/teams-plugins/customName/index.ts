import { Plugin } from "../../interface";
import { injectStyles } from "../../utils/styles";
import settingsStyles from "../settings/index.css";

injectStyles(settingsStyles, "teams-but-good-settings");

const myId = "8:orgid:9f5e3bbe-0b73-48da-bbce-3210cef4b5d5";
const newName = "Dojian";

interface CustomNamePlugin extends Plugin {
  showModal(selectedId: string): void;
  renderCustomNameButton(
    props: { selectedId: string; conversationData: { internalId: string } },
    createElement: (type: unknown, props: Record<string, unknown>) => unknown,
    component: unknown,
    icon: unknown,
  ): unknown;
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
  mainEntry: editNames,

  showModal(selectedId: string) {
    // Tear down any stale dialog so the DOM stays fresh
    document.getElementById("tbg-customname-dialog")?.remove();

    const close = () => backdrop.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "tbg-customname-dialog";
    backdrop.className = "tbg-modal-backdrop";
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });

    document.addEventListener("keydown", function onKeyDown(e) {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", onKeyDown);
      }
    });

    const modal = document.createElement("div");
    modal.className = "tbg-modal";

    // Header
    const header = document.createElement("div");
    header.className = "tbg-modal-header";

    const title = document.createElement("span");
    title.className = "tbg-modal-title";
    title.textContent = "Edit display name";

    const closeBtn = document.createElement("button");
    closeBtn.className = "tbg-modal-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "x";
    closeBtn.addEventListener("click", close);

    header.append(title, closeBtn);

    // Body
    const body = document.createElement("div");
    body.className = "tbg-modal-body";

    const input = document.createElement("input");
    input.className = "tbg-input";
    input.type = "text";
    input.placeholder = "New display name";

    body.appendChild(input);

    // Footer
    const footer = document.createElement("div");
    footer.className = "tbg-modal-footer";

    const saveBtn = document.createElement("button");
    saveBtn.className = "tbg-button-primary";
    saveBtn.style.marginBottom = "5px";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
      console.log("[CustomName] new name:", input.value, "for", selectedId);
      close();
    });

    const resetBtn = document.createElement("button");
    resetBtn.className = "tbg-button-secondary";
    resetBtn.textContent = "Reset";
    resetBtn.addEventListener("click", () => {
      input.value = "";
    });

    footer.append(saveBtn, resetBtn);

    modal.append(header, body, footer);
    backdrop.appendChild(modal);
    const mountTarget =
      document.querySelector<HTMLElement>(".fui-FluentProvider") ??
      document.body;
    mountTarget.appendChild(backdrop);
    input.focus();
  },

  renderCustomNameButton(props, createElement, component, icon) {
    const onClick = (e?: MouseEvent) => {
      e?.stopPropagation();
      console.log("Props:", props.conversationData.internalId);
      this.showModal(props.selectedId);
    };
    return createElement(component, {
      icon: createElement(icon, {}),
      onClick,
      "data-testid": "edit-display-name-menu-item",
      children: "Edit display name",
    });
  },

  patches: [
    {
      find: "chat-manage-apps-menu-item",
      replacement: [
        {
          match:
            /(return\(0,(\w+\.\w+)\)\((\w+\.\w+),{icon:\(0,\w+\.\w+\)\((\w+\.\w+),{}\),onClick:(\w+),"data-testid":"chat-manage-apps-menu-item",children:(\w+)}\)};)/,
          replace:
            "$1const customNameButton=i=>$self.renderCustomNameButton(i,$2,$3,$4);",
        },
        {
          match:
            /(\(0,(\w+.\w+)\)\(\w+,{conversationData:(\w+),simpleCollabViewData:\w+,selectedId:(\w+).selectedId}\),)/,
          replace:
            "$1(0,$2)(customNameButton,{conversationData:$3,selectedId:$4.selectedId}),",
        },
      ],
    },
  ],
};

export default customName;
