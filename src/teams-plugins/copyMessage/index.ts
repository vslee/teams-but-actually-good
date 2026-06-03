import { Plugin } from "../../interface";
import createIcon from "../../utils/icon";
import userSVGUrl from "../../svgs/user.svg";
import * as React from "react";
import { injectNotificationModal } from "../../utils/notifications";
import { OptionType } from "../../types/types";

interface copyMessagePlugin extends Plugin {
  renderCopyMessageButton(
    props: {
      actionMenuProps: { message: { content: string } };
      menuItemProps: React.HTMLAttributes<HTMLElement>;
      MenuItemComponent: React.PropsWithChildren;
    },
    composent: (cProps: {
      wrapperElement: React.PropsWithChildren;
      wrapperElementProps: {
        onClick: (e?: MouseEvent) => void;
      };
    }) => unknown,
  ): unknown;

  renderCopyMessageComposent(
    createElement: typeof React.createElement,
    wrapperElement: React.HTMLElementType,
    wrapperElementProps: React.PropsWithChildren,
  ): unknown;
}

const copyMessage: copyMessagePlugin = {
  name: "CopyMessage",
  description: "Allow you to copy messages.",
  settingsDef: {
    copyMessageFormat: {
      type: OptionType.SELECT,
      restartNeeded: true,
      options: [
        { label: "Plain text", value: "plain", default: true },
        { label: "HTML", value: "html" },
      ],
      description: "Format to copy message content.",
    },
  },

  renderCopyMessageButton(props, composent) {
    const { actionMenuProps, menuItemProps, MenuItemComponent } = props;
    const { message: k } = actionMenuProps;

    const stripHtml = (html: string) => {
      if (!html) return "";
      return html
        .replace(/<img[^>]*\balt="([^"]*)"[^>]*\/?>/gi, "$1")
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };

    const onClick = (e?: MouseEvent) => {
      e?.stopPropagation();
      const text = k?.content ?? "";
      const textFormated =
        this.settings?.copyMessageFormat === "html" ? text : stripHtml(text);
      navigator.clipboard.writeText(textFormated);
      injectNotificationModal(
        "Copied to clipboard",
        "Message was successfully copied to clipboard.",
      );
    };

    return composent({
      wrapperElement: MenuItemComponent,
      wrapperElementProps: {
        ...menuItemProps,
        onClick,
      },
    });
  },

  renderCopyMessageComposent(
    createElement,
    wrapperElement,
    wrapperElementProps,
  ) {
    const Wrapper = wrapperElement ?? "div";

    return createElement(Wrapper, {
      ...wrapperElementProps,
      content: "Copy message",
      icon: createIcon(userSVGUrl, createElement),
      "data-tid": "message-action-copy-content",
      floated: "right",
      disabled: false,
      title: "Copy message",
      "aria-label": "Copy message",
    });
  },

  patches: [
    {
      find: '-tid":"message-actions-copy-link',
      replacement: [
        {
          match:
            /(\((\w+),{\.\.\.\w+,content:\w+,"data-tid":"message-actions-copy-link",floated:"right",onClick:\w+,disabled:\w+,icon:\(0,(\w+)\.(\w+)\)\(\w+\.\w+,{}\),title:\w+,"aria-label":\w+}\)})/,
          replace:
            "$1,copyMessageButtonComposent=(cProps)=>$self.renderCopyMessageComposent($3.$4,cProps.wrapperElement,cProps.wrapperElementProps),copyMessageButton=(i)=>$self.renderCopyMessageButton(i,copyMessageButtonComposent)",
        },
        {
          match:
            /({id:"copy-link",Component:\w+,hasDivider:!1,shouldRender:(\w+)},)/,
          replace:
            '$1{id:"copy-message",Component:copyMessageButton,hasDivider:!1,shouldRender:$2},',
        },
        {
          match:
            /(\w+)=\((\w+),(\w+)\)=>\3\.filter\((\w+)=>\2\.includes\(\4\.id\)\)/,
          replace:
            '$1=($2,$3)=>$3.filter($4=>$2.includes($4.id)||($4.id==="copy-message"&&$2.includes("copy-link")))',
        },
      ],
    },
    {
      find: 'reply","follow","forward"',
      replacement: {
        match: /(reply","follow","forward")/,
        replace: '$1,"copy-message",',
      },
    },
  ],
};

export default copyMessage;
