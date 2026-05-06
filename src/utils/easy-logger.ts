const easyLogger = (level: "info" | "warn" | "error", ...args: string[]) => {
  console[level]("[Teams but (actually) good] ", ...args);
};

export default easyLogger;
