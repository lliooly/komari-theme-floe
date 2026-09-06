export type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type CalendarMonth = {
  year: number;
  month: number;
};

const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

function timestampFromParts(parts: LocalDateTimeParts) {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, 0, 0);
  return date.getTime();
}

function isValidCalendarDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseLocalDateTime(value: string): LocalDateTimeParts | null {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const parts: LocalDateTimeParts = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
  };

  if (
    !isValidCalendarDate(parts.year, parts.month, parts.day) ||
    parts.hour < 0 ||
    parts.hour > 23 ||
    parts.minute < 0 ||
    parts.minute > 59
  ) {
    return null;
  }

  return parts;
}

export function formatLocalDateTime(parts: LocalDateTimeParts) {
  if (
    !isValidCalendarDate(parts.year, parts.month, parts.day) ||
    parts.hour < 0 ||
    parts.hour > 23 ||
    parts.minute < 0 ||
    parts.minute > 59
  ) {
    return "";
  }

  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function getSystemTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function isSupportedTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getSupportedTimeZones(preferredTimeZone: string) {
  let supportedTimeZones: string[] = [];

  try {
    supportedTimeZones = Intl.supportedValuesOf("timeZone");
  } catch {
    supportedTimeZones = [];
  }

  return Array.from(new Set([preferredTimeZone, "UTC", ...supportedTimeZones]))
    .filter((timeZone) => Boolean(timeZone) && isSupportedTimeZone(timeZone))
    .sort((left, right) => left.localeCompare(right));
}

function getZonedDateTimeParts(timestamp: number, timeZone: string): LocalDateTimeParts | null {
  if (!Number.isFinite(timestamp) || !isSupportedTimeZone(timeZone)) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(new Date(timestamp));
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));
  const hour = Number(getPart("hour"));
  const minute = Number(getPart("minute"));

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function getTimeZoneOffsetMinutes(timestamp: number, timeZone: string) {
  const zonedParts = getZonedDateTimeParts(timestamp, timeZone);
  if (!zonedParts) {
    return NaN;
  }

  return Math.round((timestampFromParts(zonedParts) - timestamp) / 60000);
}

function sameDateTime(left: LocalDateTimeParts, right: LocalDateTimeParts) {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

export function localDateTimeToTimestamp(value: string, timeZone: string) {
  const inputParts = parseLocalDateTime(value);
  if (!inputParts || !isSupportedTimeZone(timeZone)) {
    return NaN;
  }

  const naiveTimestamp = timestampFromParts(inputParts);
  const initialOffset = getTimeZoneOffsetMinutes(naiveTimestamp, timeZone);
  if (!Number.isFinite(initialOffset)) {
    return NaN;
  }

  const firstCandidate = naiveTimestamp - initialOffset * 60_000;
  const correctedOffset = getTimeZoneOffsetMinutes(firstCandidate, timeZone);
  if (!Number.isFinite(correctedOffset)) {
    return NaN;
  }

  const timestamp = naiveTimestamp - correctedOffset * 60_000;
  const resolvedParts = getZonedDateTimeParts(timestamp, timeZone);
  return resolvedParts && sameDateTime(resolvedParts, inputParts)
    ? timestamp
    : NaN;
}

export function localDateTimeToISOString(value: string, timeZone: string) {
  const timestamp = localDateTimeToTimestamp(value, timeZone);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function formatLocalDateTimeLabel(value: string, locale: string) {
  const parts = parseLocalDateTime(value);
  if (!parts) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      hourCycle: "h23",
      timeZone: "UTC",
    }).format(new Date(timestampFromParts(parts)));
  } catch {
    return value.replace("T", " ");
  }
}

export function getTodayDateParts(): LocalDateTimeParts {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
}

export function getCalendarDays({ year, month }: CalendarMonth) {
  const firstDay = new Date(0);
  firstDay.setUTCFullYear(year, month - 1, 1);
  firstDay.setUTCHours(0, 0, 0, 0);

  const lastDay = new Date(0);
  lastDay.setUTCFullYear(year, month, 0);
  lastDay.setUTCHours(0, 0, 0, 0);

  const daysInMonth = lastDay.getUTCDate();
  const mondayFirstOffset = (firstDay.getUTCDay() + 6) % 7;
  const totalCells = 42;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - mondayFirstOffset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

export function moveCalendarMonth({ year, month }: CalendarMonth, offset: number): CalendarMonth {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1 + offset, 1);
  date.setUTCHours(0, 0, 0, 0);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function formatCalendarMonth(month: CalendarMonth, locale: string) {
  try {
    const date = new Date(0);
    date.setUTCFullYear(month.year, month.month - 1, 1);
    date.setUTCHours(0, 0, 0, 0);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return `${month.year}-${pad(month.month)}`;
  }
}

export function formatCalendarDate(
  month: CalendarMonth,
  day: number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "full" },
) {
  try {
    const date = new Date(0);
    date.setUTCFullYear(month.year, month.month - 1, day);
    date.setUTCHours(0, 0, 0, 0);
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
  } catch {
    return `${month.year}-${pad(month.month)}-${pad(day)}`;
  }
}

export function getWeekdayLabels(locale: string) {
  const monday = new Date(Date.UTC(2024, 0, 1));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        timeZone: "UTC",
      }).format(date);
    } catch {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
    }
  });
}
