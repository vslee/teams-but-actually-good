import { Plugin } from "../../interface";
import createIcon from "../../utils/icon";
import userSVGUrl from "../../svgs/user.svg";
import * as React from "react";

interface copyMessagePlugin extends Plugin {
  renderCopyMessageButton(
    props: {
      actionMenuProps: any;
      menuItemProps: any;
      MenuItemComponent: any;
      biTelemetry: any;
    },
    composent: (cProps: any) => unknown,
  ): unknown;

  renderCopyMessageComposent(
    createElement: typeof React.createElement,
    wrapperElement: any,
    wrapperElementProps: any,
  ): unknown;
}

const copyMessage: copyMessagePlugin = {
  name: "CopyMessage",
  description: "Allow you to copy messages.",

  renderCopyMessageButton(props, composent) {
    const { actionMenuProps, menuItemProps, MenuItemComponent } = props;
    const { message: k } = actionMenuProps;

    const onClick = (e?: MouseEvent) => {
      e?.stopPropagation();
      const text = k?.content ?? k?.body ?? "";
      navigator.clipboard.writeText(text);
      console.log("Copied:", text);
    };

    return composent({
      wrapperElement: MenuItemComponent,
      wrapperElementProps: menuItemProps,
      onClick,
    });
  },

  renderCopyMessageComposent(
    createElement,
    wrapperElement,
    wrapperElementProps,
  ) {
    // wrapperElement peut être undefined si appelé depuis copyMessageButton directement
    const Wrapper = wrapperElement ?? "div";

    const onClick = (e?: MouseEvent) => {
      e?.stopPropagation();
      console.log("Copy message composent clicked");
    };

    return createElement(Wrapper, {
      ...wrapperElementProps,
      content: "Copy message",
      icon: createIcon(userSVGUrl, createElement),
      onClick,
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
            /(\((\w+),{\.\.\.\w+,content:\w+,"data-tid":"message-actions-copy-link",floated:"right",onClick:\w+,disabled:\w+,icon:\(0,(\w+\.\w+)\)\(\w+\.\w+,{}\),title:\w+,"aria-label":\w+}\)})/,
          replace:
            "$1,copyMessageButtonComposent=(cProps)=>$self.renderCopyMessageComposent(cProps.wrapperElement,cProps.wrapperElementProps)",
        },
        {
          match:
            /((\w+\.\w+)\)\(\w+,{onClick:\w+,wrapperElement:(\w+),wrapperElementProps:(\w+),biTelemetry:\w+,isChat:\w+,channelType:\w+,messageType:\w+\.__typename,skillType:\w+\.botMetadata\?\.botTelemetryMessageType\?\?void 0,messageId:(\w+)\.id\?\?void 0,replyTo:\w+\.botMetadata\?\.replyToId\?\?void 0}\):null},)/,
          replace:
            "$1copyMessageButton=(i)=>$self.renderCopyMessageButton($2,i,copyMessageButtonComposent),",
        },
        {
          match:
            /({id:"copy-link",Component:\w+,hasDivider:!1,shouldRender:(\w+)},)/,
          replace:
            '{id:"copy-link",Component:copyMessageButton,hasDivider:!1,shouldRender:$2},',
        },
      ],
    },
  ],
};

export default copyMessage;
