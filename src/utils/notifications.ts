const CONTAINER_ID = "tbg-notification-container";

function getOrCreateContainer(): HTMLElement {
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    const mountTarget =
      document.querySelector<HTMLElement>(".fui-FluentProvider") ??
      document.body;
    mountTarget.appendChild(container);
  }
  return container;
}

function dismiss(toast: HTMLElement) {
  toast.classList.add("tbg-notification-out");
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

export interface NotificationOptions {
  /** Auto-dismiss delay in ms. Default 4000. Set to 0 to disable. */
  duration?: number;
}

export function injectNotificationModal(
  title: string,
  message?: string,
  options: NotificationOptions = {},
) {
  const { duration = 4000 } = options;

  const container = getOrCreateContainer();

  // Toast
  const toast = document.createElement("div");
  toast.className = "tbg-notification";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");

  // Accent bar
  const accent = document.createElement("div");
  accent.className = "tbg-notification-accent";

  // Body
  const body = document.createElement("div");
  body.className = "tbg-notification-body";

  const titleEl = document.createElement("span");
  titleEl.className = "tbg-notification-title";
  titleEl.textContent = title;
  body.appendChild(titleEl);

  if (message) {
    const msgEl = document.createElement("span");
    msgEl.className = "tbg-notification-message";
    msgEl.textContent = message;
    body.appendChild(msgEl);
  }

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "tbg-notification-close";
  closeBtn.setAttribute("aria-label", "Dismiss notification");
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => dismiss(toast));

  toast.append(accent, body, closeBtn);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => dismiss(toast), duration);
  }
}
