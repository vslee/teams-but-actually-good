import { Theme } from "../../interface";
import { injectStyles } from "../../utils/styles";
import style from "./index.css";

injectStyles(style, "teams-but-good-theme-test");

const theme: Theme = {
  name: "Test Theme",
};

export default theme;
