import { Plugin } from "../../interface";
import { IPluginOptionComponentProps, OptionType } from "../../types/types";
import * as React from "react";
import { getPluginSetting, setPluginSetting } from "../../utils/storage";

type EmojiList = Array<{
  name: string;
  objectId: string;
  viewUrl: string;
}>;

let emojiList: EmojiList = [];

interface customEmojisPlugin extends Plugin {
  replaceTextByEmoji(payload: {
    variables: { message: { content: string } };
  }): object;
  buildHTMLForEmoji(objectId: string, viewUrl: string, label: string): string;
}

const getAsyncgwConfig = () => ({
  token: sessionStorage.getItem("tbag_asyncgw_token"),
  baseUrl: sessionStorage.getItem("tbag_asyncgw_base_url"),
});

async function getUserList() {
  emojiList = (await getPluginSetting(
    customEmojis.name,
    "emojiList",
  )) as EmojiList;

  if (!Array.isArray(emojiList)) {
    emojiList = [];
  }
}

async function uploadCustomEmoji(
  token: string,
  imageSource: File,
  conversationId = "48:notes", // TODO need a way to authorize everyone to view the image
) {
  console.log("[CustomEmoji] Creating object on asyncgw...");

  // TODO need to find how the "ch-prod" is determined, different region does exist like us-prod
  // get an id that is used to uplaod the image
  const createRes = await fetch(
    "https://ch-prod.asyncgw.teams.microsoft.com/v1/objects/",
    {
      method: "POST",
      headers: {
        Authorization: `${token}`,
        "content-type": "application/json",
        "x-ams-post-sharing-mode": "Inline",
        "x-ms-client-version": "1415/26051416715",
        "x-ms-migration": "True",
        "x-ms-test-user": "False",
        "ms-cv": crypto.randomUUID(),
        Referer: "https://teams.microsoft.com/",
        "sec-ch-ua": '"Chromium";v="149", "Not)A;Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) MicrosoftTeams/24163.3404.3220.4317 Chrome/118.0.5993.117 Electron/27.1.3 Safari/537.36",
      },
      body: JSON.stringify({
        type: "pish/image",
        permissions: { [conversationId]: ["read"] },
        sharingMode: "Inline",
        filename: `${crypto.randomUUID()}-tbag-custom-emoji.png`,
      }),
    },
  );

  if (!createRes.ok) {
    throw new Error(
      `[TBAG] Create failed: ${createRes.status} ${await createRes.text()}`,
    );
  }

  const { id: objectId } = await createRes.json();
  console.log("[CustomEmoji] objectId:", objectId);

  let imageBytes = await imageSource.arrayBuffer();

  console.log(
    `[CustomEmoji] Image loaded (${imageBytes.byteLength} bytes), uploading...`,
  );

  // upload the image
  const putRes = await fetch(
    `https://ch-prod.asyncgw.teams.microsoft.com/v1/objects/${objectId}/content/imgpsh`,
    {
      method: "PUT",
      headers: {
        Authorization: `${token}`,
        "content-type": "application/octet-stream",
        "x-ms-migration": "True",
        "x-ms-test-user": "False",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      },
      body: imageBytes,
    },
  );

  if (!putRes.ok) {
    throw new Error(
      `[CustomEmoji] Upload failed: ${putRes.status} ${await putRes.text()}`,
    );
  }

  console.log("[CustomEmoji] Upload successful!");

  const viewUrl = `https://ch-prod.asyncgw.teams.microsoft.com/v1/objects/${objectId}/views/imgo`;

  const result = {
    objectId,
    viewUrl,
  };
  return result;
}

function uploadCustomEmojiComponent({ ReactLib }: IPluginOptionComponentProps) {
  void ReactLib;
  const [emojiName, setEmojiName] = ReactLib.useState("");
  const [emoji, setEmoji] = ReactLib.useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setEmoji(file);
  };

  const handleSendClick = async () => {
    const { token: teamsToken } = getAsyncgwConfig();
    console.log(teamsToken);
    if (emojiName.trim() === "") return;
    if (!teamsToken) return;
    if (!emoji) return;
    console.log(emoji.name, emoji.size, emoji.type);

    uploadCustomEmoji(teamsToken, emoji)
      .then(async ({ objectId, viewUrl }) => {
        emojiList = (await getPluginSetting(
          customEmojis.name,
          "emojiList",
        )) as EmojiList;

        if (!Array.isArray(emojiList)) emojiList = [];

        emojiList.push({ name: emojiName, objectId, viewUrl });

        setPluginSetting(customEmojis.name, "emojiList", emojiList);
      })
      .catch((err) => {
        console.error("Failed to upload emoji:", err);
      });
  };

  /** @jsx ReactLib.createElement */
  return (
    <div>
      <label htmlFor="customEmojiName">
        Emoji Name: (will be used like that :name:)
      </label>
      <input
        id="customEmojiName"
        type="text"
        placeholder="nods"
        value={emojiName}
        onChange={(e) => setEmojiName(e.target.value)}
      />
      <label htmlFor="customEmojiUploader">Upload Custom Emoji:</label>
      <input
        type="file"
        accept="image/png"
        id="customEmojiUploader"
        onChange={handleFileUpload}
      />
      <button onClick={handleSendClick}>Send</button>
    </div>
  );
}

const customEmojis: customEmojisPlugin = {
  name: "CustomEmojis",
  description: "Add custom emojis to your chat.",
  settingsDef: {
    customEmojiUploader: {
      type: OptionType.COMPONENT,
      component: uploadCustomEmojiComponent,
    },
  },

  buildHTMLForEmoji(objectId, viewUrl, label = "emoji") {
    return [
      `<span title="${label}" type="${label}">`,
      `<img`,
      `  src="${viewUrl}"`,
      `  itemid="tbag;${objectId}"`,
      `  itemscope=""`,
      `  itemtype="http://schema.skype.com/Emoji"`,
      `  alt="${label}"`,
      `  style="width:20px;height:20px"`,
      `>`,
      `</span>`,
    ].join("");
  },

  replaceTextByEmoji(payload) {
    if (!payload.variables?.message?.content) return payload;
    const message = payload.variables.message;

    if (!Array.isArray(emojiList)) return payload;

    emojiList.forEach(({ name, objectId, viewUrl }) => {
      const shortcode = `:${name}:`;
      if (message.content.includes(shortcode)) {
        message.content = message.content.replace(
          shortcode,
          this.buildHTMLForEmoji(objectId, viewUrl, name),
        );
      }
    });
    return payload;
  },

  mainEntry: getUserList,

  patches: [
    {
      find: "},this.sendMessage=",
      replacement: {
        match:
          /(this.sendMessage=\w+=>\w+\({requestId:\w+\.requestId,rendererId:\w+\.rendererId,windowId:\w+\.windowId,payload:)(\w+\.request),/,
        replace: "$1$self.replaceTextByEmoji($2),",
      },
    },
    {
      find: "?.emojiPickerConfigurationViewModel??{},[",
      replacement: {
        match: /=\w+\|\|!\w+\|\|!\w+/,
        replace: "=false",
      },
    },
  ],
};

export default customEmojis;
