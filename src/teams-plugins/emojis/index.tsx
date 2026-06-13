import { Plugin } from "../../interface";
import { IPluginOptionComponentProps, OptionType } from "../../types/types";
import * as React from "react";
import { getPluginSetting, setPluginSetting } from "../../utils/storage";

type EmojiList = Array<{
  name: string;
  objectId: string;
  viewUrl: string;
  base64Image: string;
}>;

interface customEmojisPlugin extends Plugin {
  replaceTextByEmoji(payload: {
    variables: { message: { content: string } };
  }): object;
  buildHTMLForEmoji(objectId: string, viewUrl: string, label: string): string;
  // logStuff(stuff: string | object): string | object;
}

const getAsyncgwConfig = () => sessionStorage.getItem("tbag_asyncgw_token");
let emojiList: EmojiList = [];
let asnycgwBaseUrl: string = "https://ch-prod.asyncgw.teams.microsoft.com";

async function main() {
  await getUserList();

  const key = Object.keys(localStorage).find(
    (k) => k.startsWith("tmp.auth.") && k.includes("Discover.SKYPE-TOKEN"),
  );

  if (!key) {
    console.warn("[CustomEmojis] No Skype TMP Auth found in localStorage.");
    return;
  }

  const skypeAuthInfo = JSON.parse(localStorage.getItem(key) || "{}");

  if (!skypeAuthInfo?.item) {
    console.warn("[CustomEmojis] No items found in Skype Auth Info.");
    return;
  }

  const item = skypeAuthInfo?.item;

  if (!item?.regionGtms?.ams) {
    console.warn("[CustomEmojis] No AMS GTM found in Skype Auth Info.");
    return;
  }

  asnycgwBaseUrl = item.regionGtms.ams;
  console.log("[CustomEmojis] Discovered asyncgw base URL:", asnycgwBaseUrl);
}

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
  const createRes = await fetch(`${asnycgwBaseUrl}/v1/objects/`, {
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
  });

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
    `${asnycgwBaseUrl}/v1/objects/${objectId}/content/imgpsh`,
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

  const viewUrl = `${asnycgwBaseUrl}/v1/objects/${objectId}/views/imgo`;

  const bytes = new Uint8Array(imageBytes);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Image = `data:image/png;base64,${btoa(binary)}`;

  const result = {
    objectId,
    viewUrl,
    base64Image,
  };
  return result;
}

function uploadCustomEmojiComponent({ ReactLib }: IPluginOptionComponentProps) {
  void ReactLib;
  const [emojiName, setEmojiName] = ReactLib.useState("");
  const [emoji, setEmoji] = ReactLib.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = ReactLib.useState<string | null>(null);
  const [status, setStatus] = ReactLib.useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setEmoji(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("idle");
  };

  const handleSendClick = async () => {
    const teamsToken = getAsyncgwConfig();

    if (emojiName.trim() === "") return;
    if (!teamsToken) return;
    if (!emoji) return;

    setStatus("uploading");

    uploadCustomEmoji(teamsToken, emoji)
      .then(async ({ objectId, viewUrl, base64Image }) => {
        emojiList = (await getPluginSetting(
          customEmojis.name,
          "emojiList",
        )) as EmojiList;

        if (!Array.isArray(emojiList)) emojiList = [];

        emojiList.push({ name: emojiName, objectId, viewUrl, base64Image });

        setPluginSetting(customEmojis.name, "emojiList", emojiList);
        setStatus("success");
        setEmojiName("");
        setEmoji(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      })
      .catch((err) => {
        console.error("Failed to upload emoji:", err);
        setStatus("error");
      });
  };

  const canSubmit =
    emojiName.trim() !== "" && emoji !== null && getAsyncgwConfig() !== null;

  /** @jsx ReactLib.createElement */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="tbg-setting-row">
        <div className="tbg-setting-label">
          <span className="tbg-setting-name">Emoji Name</span>
          <span className="tbg-setting-description">
            Used as :name: shortcode in chat
          </span>
        </div>
        <div className="tbg-setting-control">
          <input
            className="tbg-input"
            type="text"
            placeholder="nods"
            value={emojiName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmojiName(e.target.value);
              setStatus("idle");
            }}
          />
        </div>
      </div>
      <div className="tbg-setting-row">
        <div className="tbg-setting-label">
          <span className="tbg-setting-name">Image File</span>
          <span className="tbg-setting-description">
            {emoji ? emoji.name : "PNG images only"}
          </span>
        </div>
        <div className="tbg-setting-control">
          <label style={{ cursor: "pointer" }}>
            <span
              className="tbg-button-secondary"
              style={{
                display: "inline-block",
                width: "auto",
                padding: "5px 12px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {emoji ? "Change\u2026" : "Browse\u2026"}
            </span>
            <input
              type="file"
              accept="image/png"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
      {previewUrl && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            background: "var(--colorNeutralBackground3)",
            border: "1px solid var(--colorNeutralStroke2)",
            borderRadius: "var(--borderRadiusMedium)",
          }}
        >
          <img
            src={previewUrl}
            alt="emoji preview"
            style={{
              width: "32px",
              height: "32px",
              objectFit: "contain",
              borderRadius: "var(--borderRadiusSmall)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "13px",
              color: "var(--colorNeutralForeground1)",
            }}
          >
            {emojiName.trim() ? `:${emojiName.trim()}:` : "(set a name above)"}
          </span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <button
          className="tbg-button-primary"
          disabled={!canSubmit || status === "uploading"}
          onClick={handleSendClick}
          style={{
            opacity: !canSubmit || status === "uploading" ? 0.6 : 1,
            cursor:
              !canSubmit || status === "uploading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "uploading" ? "Uploading\u2026" : "Upload Emoji"}
        </button>
        {status === "success" && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--colorPaletteGreenForeground1, #107c10)",
              textAlign: "center",
            }}
          >
            Emoji uploaded successfully!
          </span>
        )}
        {status === "error" && (
          <span className="tbg-setting-restart" style={{ textAlign: "center" }}>
            Upload failed. Check the console for details.
          </span>
        )}
      </div>
    </div>
  );
}

function emojiListComponent({ ReactLib }: IPluginOptionComponentProps) {
  void ReactLib;
  const [list, setList] = ReactLib.useState<EmojiList>([]);
  const [editingId, setEditingId] = ReactLib.useState<string | null>(null);
  const [editingName, setEditingName] = ReactLib.useState("");

  ReactLib.useEffect(() => {
    getPluginSetting(customEmojis.name, "emojiList").then((stored) => {
      if (Array.isArray(stored)) setList(stored as EmojiList);
    });
  }, []);

  async function saveList(next: EmojiList) {
    await setPluginSetting(customEmojis.name, "emojiList", next);
    emojiList = next;
    setList(next);
  }

  function startEdit(entry: EmojiList[number]) {
    setEditingId(entry.objectId);
    setEditingName(entry.name);
  }

  async function commitEdit(objectId: string) {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    const next = list.map((e) =>
      e.objectId === objectId ? { ...e, name: trimmed } : e,
    );
    await saveList(next);
    setEditingId(null);
  }

  async function deleteEntry(objectId: string) {
    await saveList(list.filter((e) => e.objectId !== objectId));
  }

  /** @jsx ReactLib.createElement */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span className="tbg-setting-name">Your Emojis</span>
      {list.length === 0 ? (
        <p
          className="tbg-setting-description"
          style={{ textAlign: "center", padding: "8px 0", margin: 0 }}
        >
          No custom emojis uploaded yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: "8px",
            maxHeight: "200px",
            overflowY: "auto",
            padding: "4px 2px",
          }}
        >
          {list.map((entry) => (
            <div
              key={entry.objectId}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "6px 4px",
                background: "var(--colorNeutralBackground3)",
                border: "1px solid var(--colorNeutralStroke2)",
                borderRadius: "var(--borderRadiusMedium)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* delete button */}
              <button
                title="Delete emoji"
                onClick={() => deleteEntry(entry.objectId)}
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  width: "16px",
                  height: "16px",
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--colorNeutralForeground3)",
                  fontSize: "12px",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--borderRadiusSmall)",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--colorPaletteDarkOrangeForeground2, #a80000)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--colorNeutralBackground4)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--colorNeutralForeground3)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
              >
                ✕
              </button>

              {entry.base64Image ? (
                <img
                  src={entry.base64Image}
                  alt={entry.name}
                  title={`:${entry.name}:`}
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "contain",
                    marginTop: "6px",
                  }}
                />
              ) : (
                <div
                  title={`:${entry.name}:`}
                  style={{
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--colorNeutralBackground4)",
                    borderRadius: "var(--borderRadiusSmall)",
                    fontSize: "10px",
                    color: "var(--colorNeutralForeground3)",
                    marginTop: "6px",
                  }}
                >
                  ?
                </div>
              )}

              {editingId === entry.objectId ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    width: "100%",
                  }}
                >
                  <input
                    className="tbg-input"
                    style={{
                      fontSize: "10px",
                      padding: "2px 4px",
                      minWidth: 0,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                    value={editingName}
                    autoFocus
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingName(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") commitEdit(entry.objectId);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button
                    className="tbg-button-primary"
                    style={{ padding: "2px 0", fontSize: "10px" }}
                    onClick={() => commitEdit(entry.objectId)}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <span
                  title="Click to rename"
                  onClick={() => startEdit(entry)}
                  style={{
                    fontSize: "10px",
                    color: "var(--colorNeutralForeground2)",
                    width: "100%",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  :{entry.name}:
                </span>
              )}
            </div>
          ))}
        </div>
      )}
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
    customEmojiList: {
      type: OptionType.COMPONENT,
      component: emojiListComponent,
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

  mainEntry: main,

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
