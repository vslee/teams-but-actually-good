const easyLogger = (level: "info" | "warn" | "error", ...args: any[]) => {
  console[level]("[Teams but (actually) good] ", ...args);
};

export default easyLogger;
