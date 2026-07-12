import { Devs } from "../../data/devs";
import { Plugin } from "../../interface";

const notifBannerRemover: Plugin = {
  name: "NotificationBannerRemover",
  description: "Simply removes that annoying notification banner.",
  author: Devs.LeonimusT,
  patches: [
    {
      find: 'enableVisualRefreshBackground","enableCoreVisualRefresh","',
      replacement: {
        match: /(onAreaMeasurementsAvailable:\w+,slotName:(\w+)}\)=>{)/,
        replace: '$1if($2 === "notifications") return null;',
      },
    },
  ],
};

export default notifBannerRemover;
