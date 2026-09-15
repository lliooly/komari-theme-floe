export const ANNOUNCEMENT_TEXT_COLORS = ["white", "green", "yellow", "red"] as const;
export type AnnouncementTextColor = (typeof ANNOUNCEMENT_TEXT_COLORS)[number];
export const DEFAULT_ANNOUNCEMENT_TEXT_COLOR: AnnouncementTextColor = "yellow";

export interface Announcement {
  enabled: boolean;
  content: string;
  startsAt: string;
  endsAt: string;
  textColor: AnnouncementTextColor;
}

export const EMPTY_ANNOUNCEMENT: Announcement = {
  enabled: false,
  content: "",
  startsAt: "",
  endsAt: "",
  textColor: DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
};

export function parseSettings(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try { return parseSettings(JSON.parse(value)); } catch { return {}; }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

export function readAnnouncement(settings: unknown): Announcement {
  const raw = parseSettings(settings);
  const nested = parseSettings(raw.announcement);
  const field = (key: keyof Announcement) => nested[key] ?? raw[`announcement.${key}`];
  const string = (key: keyof Announcement) =>
    typeof field(key) === "string" ? (field(key) as string).trim() : "";
  const textColor = field("textColor");
  return {
    enabled: field("enabled") === true,
    content: string("content"),
    startsAt: string("startsAt"),
    endsAt: string("endsAt"),
    textColor: typeof textColor === "string" && (ANNOUNCEMENT_TEXT_COLORS as readonly string[]).includes(textColor)
      ? textColor as AnnouncementTextColor
      : DEFAULT_ANNOUNCEMENT_TEXT_COLOR,
  };
}

export function getAnnouncementTextColorClass(color: AnnouncementTextColor): string {
  return {
    white: "text-white",
    green: "text-green-500 dark:text-green-400",
    yellow: "text-yellow-500 dark:text-yellow-400",
    red: "text-red-500 dark:text-red-400",
  }[color];
}

const SHORT_ANNOUNCEMENT_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
// Native Komari fields do not carry a timezone, so the short form uses the site's fixed convention.
const DEFAULT_ANNOUNCEMENT_OFFSET = "+08:00";

function isValidCalendarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
) {
  if (
    month < 1 || month > 12 || day < 1 || day > 31 ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59 ||
    second < 0 || second > 59
  ) {
    return false;
  }

  const calendar = new Date(Date.UTC(year, month - 1, day));
  return calendar.getUTCFullYear() === year
    && calendar.getUTCMonth() + 1 === month
    && calendar.getUTCDate() === day;
}

export function announcementTime(value: string): number {
  const normalizedValue = value.trim();
  const shortMatch = normalizedValue.match(SHORT_ANNOUNCEMENT_TIME_PATTERN);
  if (shortMatch) {
    const [, yearText, monthText, dayText, hourText, minuteText] = shortMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!isValidCalendarTime(year, month, day, hour, minute, 0)) return NaN;
    return Date.parse(`${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:00${DEFAULT_ANNOUNCEMENT_OFFSET}`);
  }

  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-](\d{2}):(\d{2}))$/);
  if (!match) return NaN;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = secondText ? Number(secondText) : 0;
  const offsetHour = offsetHourText ? Number(offsetHourText) : 0;
  const offsetMinute = offsetMinuteText ? Number(offsetMinuteText) : 0;
  if (!isValidCalendarTime(year, month, day, hour, minute, second) || offsetHour > 23 || offsetMinute > 59) return NaN;
  return Date.parse(normalizedValue);
}

export function announcementStatus(value: Announcement, now: number) {
  if (!value.enabled) return "disabled";
  const start = announcementTime(value.startsAt);
  const end = announcementTime(value.endsAt);
  if (!value.content.trim() || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "invalid";
  if (now >= end) return "expired";
  return now < start ? "scheduled" : "active";
}

export function announcementUrl(value: string): string | undefined {
  try {
    const url = new URL(value, "https://announcement.invalid");
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
}

export function localDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
