/**
 * Inject CSS string into the document head as a style element
 * If the DOM is not ready, waits for DOMContentLoaded
 *
 * @export
 * @param {string} css - The CSS content to inject
 * @param {string} [id] - Optional ID for the style element (to prevent duplicates)
 * @returns {Promise<HTMLStyleElement>} The created style element
 */
export function injectStyles(
  css: string,
  id?: string,
): Promise<HTMLStyleElement> {
  return new Promise((resolve) => {
    const doInject = () => {
      // Check if a style with this ID already exists
      if (id) {
        const existing = document.getElementById(id);
        if (existing) {
          resolve(existing as HTMLStyleElement);
          return;
        }
      }

      const style = document.createElement("style");
      if (id) {
        style.id = id;
      }
      style.textContent = css;
      document.head.appendChild(style);

      resolve(style);
    };

    // If document.head is available, inject immediately
    if (document.head) {
      doInject();
    } else {
      // Otherwise wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", doInject, { once: true });
      } else {
        // DOM is already loaded but head doesn't exist (shouldn't happen, but just in case)
        doInject();
      }
    }
  });
}

/**
 * @deprecated Use injectStyles instead
 * Load file and append a style element in the dom
 *
 * @export
 * @param {string} _path
 */
export function loadStyle(_path: string) {
  console.warn("loadStyle is deprecated, use injectStyles instead");
}

export function applyStyles(theme: Record<string, string>) {
  for (const [id, classes] of Object.entries(theme)) {
    const el = document.getElementById(id);
    if (el) {
      el.className = classes;
    }
  }
}
