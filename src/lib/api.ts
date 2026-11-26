import { fetchJson, withRequestTimeout } from "./request";

/**
 * API utility functions for settings management
 */

export interface SettingsResponse {
  sitename: string;
  description: string;
  allow_cors: boolean;
  geo_ip_enabled: boolean;
  geo_ip_provider: string;
  o_auth_provider: string;
  o_auth_enabled: boolean;
  custom_head: string;
  CreatedAt: string;
  UpdatedAt: string;
  [key: string]: any;
}

function normalizeSiteDescription(description: string): string {
  return description.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeSettingsPayload(
  settings: Partial<SettingsResponse>
): Partial<SettingsResponse> {
  if (typeof settings.description !== "string") {
    return settings;
  }

  return {
    ...settings,
    description: normalizeSiteDescription(settings.description),
  };
}

/**
 * Fetch settings from the API
 * @returns Promise containing the settings data
 */
export async function getSettings(): Promise<SettingsResponse> {
  try {
    const data = await fetchJson<{ data: SettingsResponse }>("/api/admin/settings");
    const settings: Partial<SettingsResponse> = { ...data.data };
    delete settings.CreatedAt;
    delete settings.UpdatedAt;
    delete settings.id;

    return normalizeSettingsPayload(settings) as SettingsResponse;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    throw error;
  }
}

/**
 * Update settings via the API
 * @param settings - The settings object to update
 * @returns Promise containing the response
 */
export async function updateSettings(
  settings: Partial<SettingsResponse>
): Promise<void> {
  await withRequestTimeout(async (signal) => {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeSettingsPayload(settings)),
      signal,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
  });
}
