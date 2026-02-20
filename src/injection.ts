import easyLogger from "./easy-logger";

window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hostname.includes("teams.microsoft.com")) {
    easyLogger(`Skipping injection on ${window.location.hostname}`);
    return;
  }

  easyLogger("TypeScript Injection Successful!");
});
