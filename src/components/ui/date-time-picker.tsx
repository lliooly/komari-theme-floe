"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "@/components/Icones/Reicon";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  formatCalendarDate,
  formatCalendarMonth,
  formatLocalDateTime,
  formatLocalDateTimeLabel,
  getCalendarDays,
  getSupportedTimeZones,
  getTodayDateParts,
  getWeekdayLabels,
  moveCalendarMonth,
  parseLocalDateTime,
  type CalendarMonth,
  type LocalDateTimeParts,
} from "@/lib/dateTime";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateTimePickerProps = {
  id: string;
  value: string;
  timeZone: string;
  placeholder: string;
  onChange: (value: string) => void;
  onTimeZoneChange: (timeZone: string) => void;
};

function sameCalendarDate(
  left: LocalDateTimeParts | null,
  right: LocalDateTimeParts | null,
) {
  return Boolean(
    left &&
      right &&
      left.year === right.year &&
      left.month === right.month &&
      left.day === right.day,
  );
}

function monthFromParts(parts: LocalDateTimeParts): CalendarMonth {
  return { year: parts.year, month: parts.month };
}

export function DateTimePicker({
  id,
  value,
  timeZone,
  placeholder,
  onChange,
  onTimeZoneChange,
}: DateTimePickerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || "en";
  const effectiveTimeZone = timeZone || "UTC";
  const selected = parseLocalDateTime(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<CalendarMonth | null>(null);
  const [today, setToday] = useState<LocalDateTimeParts | null>(null);

  const timeZones = useMemo(
    () => getSupportedTimeZones(effectiveTimeZone),
    [effectiveTimeZone],
  );
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);
  const effectiveViewMonth =
    viewMonth || (selected ? monthFromParts(selected) : { year: 2000, month: 1 });
  const calendarDays = getCalendarDays(effectiveViewMonth);
  const monthLabel = formatCalendarMonth(effectiveViewMonth, locale);
  const formattedValue = formatLocalDateTimeLabel(value, locale);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const nextToday = getTodayDateParts();
      setToday(nextToday);
      setViewMonth(selected ? monthFromParts(selected) : monthFromParts(nextToday));
    }
    setOpen(nextOpen);
  };

  const updateDate = (day: number) => {
    const current = selected || {
      year: effectiveViewMonth.year,
      month: effectiveViewMonth.month,
      day,
      hour: 0,
      minute: 0,
    };

    onChange(formatLocalDateTime({ ...current, ...effectiveViewMonth, day }));
  };

  const updateTime = (key: "hour" | "minute", rawValue: string) => {
    if (!selected) {
      return;
    }

    onChange(formatLocalDateTime({ ...selected, [key]: Number(rawValue) }));
  };

  const selectToday = () => {
    const nextToday = getTodayDateParts();
    const current = selected || nextToday;
    setToday(nextToday);
    setViewMonth(monthFromParts(nextToday));
    onChange(
      formatLocalDateTime({
        ...nextToday,
        hour: selected ? current.hour : 0,
        minute: selected ? current.minute : 0,
      }),
    );
  };

  const clearValue = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          className={cn(
            "flex h-10 w-full min-w-0 items-center gap-2 rounded-md bg-background px-3 py-2 text-left text-base ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm",
            !formattedValue && "text-muted-foreground",
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{formattedValue || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-4"
        aria-label={placeholder}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label={t("announcement.previousMonth")}
              onClick={() => setViewMonth(moveCalendarMonth(effectiveViewMonth, -1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold" aria-live="polite">
              {monthLabel}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={selectToday}
              >
                {t("announcement.today")}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={t("announcement.nextMonth")}
                onClick={() => setViewMonth(moveCalendarMonth(effectiveViewMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div role="grid" aria-label={monthLabel} className="space-y-1">
            <div role="row" className="grid grid-cols-7 gap-1">
              {weekdayLabels.map((label) => (
                <span
                  key={label}
                  role="columnheader"
                  className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <div key={weekIndex} role="row" className="grid grid-cols-7 gap-1">
                {calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${weekIndex}-${dayIndex}`}
                        role="gridcell"
                        aria-hidden="true"
                        className="h-9"
                      />
                    );
                  }

                  const dayParts: LocalDateTimeParts = {
                    year: effectiveViewMonth.year,
                    month: effectiveViewMonth.month,
                    day,
                    hour: selected?.hour || 0,
                    minute: selected?.minute || 0,
                  };
                  const isSelected = sameCalendarDate(selected, dayParts);
                  const isToday = sameCalendarDate(today, dayParts);

                  return (
                    <div
                      key={`${effectiveViewMonth.year}-${effectiveViewMonth.month}-${day}`}
                      role="gridcell"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        aria-label={formatCalendarDate(effectiveViewMonth, day, locale)}
                        aria-pressed={isSelected}
                        aria-current={isToday ? "date" : undefined}
                        className={cn(
                          "flex h-9 w-full items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          isToday && !isSelected && "ring-1 ring-primary",
                        )}
                        onClick={() => updateDate(day)}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-3">
            <label className="min-w-0 space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">
                {t("announcement.hour")}
              </span>
              <select
                value={selected ? String(selected.hour).padStart(2, "0") : "00"}
                onChange={(event) => updateTime("hour", event.target.value)}
                disabled={!selected}
                className="h-10 w-full min-w-0 rounded-md bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t("announcement.hour")}
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={String(hour).padStart(2, "0")}>
                    {String(hour).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">
                {t("announcement.minute")}
              </span>
              <select
                value={selected ? String(selected.minute).padStart(2, "0") : "00"}
                onChange={(event) => updateTime("minute", event.target.value)}
                disabled={!selected}
                className="h-10 w-full min-w-0 rounded-md bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t("announcement.minute")}
              >
                {Array.from({ length: 60 }, (_, minute) => (
                  <option key={minute} value={String(minute).padStart(2, "0")}>
                    {String(minute).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 min-w-0 space-y-1 sm:col-span-1">
              <span className="block text-xs font-medium text-muted-foreground">
                {t("announcement.timezoneSelect")}
              </span>
              <select
                value={effectiveTimeZone}
                onChange={(event) => onTimeZoneChange(event.target.value)}
                className="h-10 w-full min-w-0 rounded-md bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("announcement.timezoneSelect")}
              >
                {timeZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-end border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value}
              onClick={clearValue}
            >
              {t("announcement.clearDateTime")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
