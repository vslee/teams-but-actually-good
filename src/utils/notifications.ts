const CONTAINER_ID = "tbg-notification-container";

const BELL_SVG = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2a6.5 6.5 0 0 1 6.494 6.155L16.5 8.5v3.988l1.268 2.536A1 1 0 0 1 16.877 16.5H13a3 3 0 0 1-5.995.176L7 16.5H3.124a1 1 0 0 1-.891-1.476L3.5 12.488V8.5A6.5 6.5 0 0 1 10 2Z"/></svg>`;
const BELL_SVG_LG = `<svg width="22" height="22" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2a6.5 6.5 0 0 1 6.494 6.155L16.5 8.5v3.988l1.268 2.536A1 1 0 0 1 16.877 16.5H13a3 3 0 0 1-5.995.176L7 16.5H3.124a1 1 0 0 1-.891-1.476L3.5 12.488V8.5A6.5 6.5 0 0 1 10 2Z"/></svg>`;

function safeSetInnerHTML(el: HTMLElement, html: string) {
  const policy = (
    window as Window & {
      __tbg_trusted_policy?: { createHTML(s: string): unknown };
    }
  ).__tbg_trusted_policy;
  if (policy) {
    el.innerHTML = policy.createHTML(html) as unknown as string;
  } else {
    el.innerHTML = html;
  }
}

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
  /** App name shown in the notification header. Default "Teams but (actually) good". */
  appName?: string;
}

export function injectNotificationModal(
  title: string,
  message?: string,
  options: NotificationOptions = {},
) {
  const { duration = 4000, appName = "Teams but (actually) good" } = options;

  const container = getOrCreateContainer();

  const toast = document.createElement("div");
  toast.className = "tbg-notification";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "polite");

  const header = document.createElement("div");
  header.className = "tbg-notification-header";

  const appIcon = document.createElement("span");
  appIcon.className = "tbg-notification-app-icon";
  safeSetInnerHTML(appIcon, BELL_SVG);

  const appNameEl = document.createElement("span");
  appNameEl.className = "tbg-notification-app-name";
  appNameEl.textContent = appName;

  const closeBtn = document.createElement("button");
  closeBtn.className = "tbg-notification-close";
  closeBtn.setAttribute("aria-label", "Dismiss notification");
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => dismiss(toast));

  header.append(appIcon, appNameEl, closeBtn);

  const content = document.createElement("div");
  content.className = "tbg-notification-content";

  const iconWrap = document.createElement("div");
  iconWrap.className = "tbg-notification-icon";
  safeSetInnerHTML(iconWrap, BELL_SVG_LG);

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

  content.append(iconWrap, body);
  toast.append(header, content);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => dismiss(toast), duration);
  }
}
