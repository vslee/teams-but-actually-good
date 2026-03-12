import { Plugin } from "../../interface";

function simulateActivity() {
  // Move the mouse slightly each time so Teams' idle detection sees continuous movement
  const x = Math.floor(Math.random() * window.innerWidth);
  const y = Math.floor(Math.random() * window.innerHeight);

  document.dispatchEvent(
    new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
    }),
  );
}

function keepUserOnline() {
  simulateActivity();
  setInterval(simulateActivity, 30_000);
}

const Status: Plugin = {
  name: "NeverGoIdle",
  description: "Always show that you're online.",
  patches: [],
  mainEntry: keepUserOnline,
};

export default Status;
