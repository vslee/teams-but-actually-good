import * as React from "react";

export default function createIcon(
  svgUrl: string,
  createElement: typeof React.createElement,
) {
  return createElement("img", {
    src: svgUrl,
    style: {
      height: "17px",
      filter: "brightness(0) invert(1)",
    },
    "aria-hidden": "true",
  });
}
