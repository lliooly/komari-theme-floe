import { getSettings, updateSettings } from "./api";
import { parseSettings } from "./announcement";
import { withRequestTimeout } from "./request";

// Serialize writes from the theme controls and announcement editor in this tab.
// Always merge against the server so editing one section preserves the others.
let queue: Promise<unknown> = Promise.resolve();
export function updateThemeSettings(update: (current: Record<string, unknown>) => Record<string, unknown>): Promise<void> {
  const save = queue.catch(() => {}).then(async () => {
    const write = async () => {
      const settings = await getSettings();
      await updateSettings({ theme_settings: update(parseSettings(settings.theme_settings)) });
    };
    // Web Locks coordinate cooperating tabs and embedded settings on this origin.
    // Other browsers/devices still require a backend compare-and-swap API.
    if (typeof navigator !== "undefined" && navigator.locks) {
      await withRequestTimeout(
        (signal) => navigator.locks.request("floe-theme-settings", { signal }, write),
        { timeout: 65_000 },
      );
    } else {
      await write();
    }
  });
  queue = save;
  return save;
}
