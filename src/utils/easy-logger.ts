const easyLogger = (level: "info" | "warn" | "error", ...args: any[]) => {
  console[level]("[Teams But Good] ", ...args);
};

export default easyLogger;
