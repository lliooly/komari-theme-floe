"use client";

import { useEffect, useRef, useState } from "react";
import { Megaphone, Save } from "@/components/Icones/Reicon";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useTheme } from "@/contexts/ThemeContext";
import { useAnnouncement } from "@/contexts/AnnouncementContext";
import {
  announcementStatus,
  getAnnouncementTextColorClass,
  localDateTime,
  type Announcement,
  type AnnouncementTextColor,
} from "@/lib/announcement";
import { getSystemTimeZone, localDateTimeToTimestamp } from "@/lib/dateTime";
import { updateThemeSettings } from "@/lib/themeSettings";
import { cn } from "@/lib/utils";
import AnnouncementMarkdown from "./AnnouncementMarkdown";

const announcementTextColorOptions: ReadonlyArray<{
  value: AnnouncementTextColor;
  swatchClassName: string;
}> = [
  { value: "white", swatchClassName: "border border-border bg-white" },
  { value: "green", swatchClassName: "bg-green-500" },
  { value: "yellow", swatchClassName: "bg-yellow-500" },
  { value: "red", swatchClassName: "bg-red-500" },
];

function EditorForm() {
  const { announcement, loaded, accept, now } = useAnnouncement();
  const { t } = useTranslation();
  const hydratedRef = useRef(false);
  const [enabled, setEnabled] = useState(announcement.enabled);
  const [content, setContent] = useState(announcement.content);
  const [start, setStart] = useState(localDateTime(announcement.startsAt));
  const [end, setEnd] = useState(localDateTime(announcement.endsAt));
  const [textColor, setTextColor] = useState(announcement.textColor);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    setTimezone(getSystemTimeZone());
  }, []);

  useEffect(() => {
    if (!loaded || hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;
    setEnabled(announcement.enabled);
    setContent(announcement.content);
    setStart(localDateTime(announcement.startsAt));
    setEnd(localDateTime(announcement.endsAt));
    setTextColor(announcement.textColor);
  }, [announcement, loaded]);

  const save = async (disable = false) => {
    setError("");
    setMessage("");
    const starts = localDateTimeToTimestamp(start, timezone);
    const ends = localDateTimeToTimestamp(end, timezone);
    if (!disable && enabled && (!content.trim() || !Number.isFinite(starts) || !Number.isFinite(ends) || ends <= starts || ends <= Date.now())) {
      setError(t("announcement.validation"));
      return;
    }
    const value: Announcement = disable ? { ...announcement, enabled: false } : {
      enabled, content: content.trim(),
      startsAt: Number.isFinite(starts) ? new Date(starts).toISOString() : "",
      endsAt: Number.isFinite(ends) ? new Date(ends).toISOString() : "",
      textColor,
    };
    setSaving(true);
    try {
      await updateThemeSettings((current) => ({
        ...Object.fromEntries(Object.entries(current).filter(([key]) => key !== "announcement" && !key.startsWith("announcement."))),
        announcement: value,
      }));
      accept(value);
      if (disable) setEnabled(false);
      setMessage(t("announcement.saved"));
    } catch { setError(t("announcement.saveFailed")); }
    finally { setSaving(false); }
  };

  return <form className="min-w-0 space-y-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <p className="text-sm text-muted-foreground">{t("announcement.statusLabel")}: {t(`announcement.status.${announcementStatus(announcement, now)}`)}</p>
    <fieldset disabled={saving || !loaded} className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="announcement-enabled">{t("announcement.enabled")}</label>
        <Switch id="announcement-enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <div className="space-y-2">
        <label htmlFor="announcement-content">{t("announcement.content")}</label>
        <Textarea id="announcement-content" value={content} onChange={(e) => setContent(e.target.value)} className="min-w-0 min-h-32 max-h-64 resize-y field-sizing-fixed font-mono" />
        <p className="text-xs text-muted-foreground">{t("announcement.markdownHelp")}</p>
      </div>
      <p className="text-sm text-muted-foreground">{t("announcement.timezone", { timezone })}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label htmlFor="announcement-start">{t("announcement.startsAt")}</label>
          <DateTimePicker
            id="announcement-start"
            value={start}
            timeZone={timezone}
            placeholder={t("announcement.dateTimePlaceholder")}
            onChange={setStart}
            onTimeZoneChange={setTimezone}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <label htmlFor="announcement-end">{t("announcement.endsAt")}</label>
          <DateTimePicker
            id="announcement-end"
            value={end}
            timeZone={timezone}
            placeholder={t("announcement.dateTimePlaceholder")}
            onChange={setEnd}
            onTimeZoneChange={setTimezone}
          />
        </div>
      </div>
      <div className="space-y-2">
        <span className="block">{t("announcement.textColor")}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {announcementTextColorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={textColor === option.value}
              className={cn(
                "flex min-w-0 items-center justify-center gap-2 rounded-lg bg-muted/50 px-2 py-2 text-xs text-foreground transition-colors hover:bg-muted",
                textColor === option.value && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              onClick={() => setTextColor(option.value)}
            >
              <span aria-hidden="true" className={cn("h-3 w-3 shrink-0 rounded-full", option.swatchClassName)} />
              <span className="truncate">{t(`announcement.colors.${option.value}`)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">{t("announcement.preview")}</h3>
        <div className={cn(
          "announcement-banner rounded-lg border-0 bg-background/80 p-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
          getAnnouncementTextColorClass(textColor),
        )}>
          <div className="announcement-scroll overflow-auto" tabIndex={0} role="region" aria-label={t("announcement.preview")}>
            {content.trim() ? <AnnouncementMarkdown content={content} /> : <p className="text-sm">{t("announcement.previewEmpty")}</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving} aria-busy={saving}><Save className="h-4 w-4" aria-hidden="true" />{t(saving ? "announcement.saving" : "announcement.save")}</Button>
        <Button type="button" variant="outline" disabled={saving || !announcement.enabled} onClick={() => void save(true)}>{t("announcement.disableNow")}</Button>
      </div>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p role="status" className="text-sm text-muted-foreground">{message}</p>
  </form>;
}

type AnnouncementEditorProps = {
  variant?: "dialog" | "inline";
};

export default function AnnouncementEditor({ variant = "dialog" }: AnnouncementEditorProps) {
  const { isThemeSettingsAdmin } = useTheme();
  const { loaded } = useAnnouncement();
  const { t } = useTranslation();
  if (!isThemeSettingsAdmin) return null;

  if (variant === "inline") {
    return (
      <section
        data-card-blur-surface="true"
        className="rounded-2xl border border-border/70 bg-card/35 p-4 shadow-sm md:p-6"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Megaphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{t("announcement.manage")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("announcement.description")}</p>
          </div>
        </div>
        <EditorForm />
      </section>
    );
  }

  return <Dialog>
    <DialogTrigger asChild><Button type="button" variant="outline" className="w-full justify-start" disabled={!loaded}><Megaphone className="h-4 w-4" aria-hidden="true" />{t("announcement.manage")}</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl grid-cols-1 overflow-y-auto">
      <DialogTitle>{t("announcement.manage")}</DialogTitle>
      <DialogDescription>{t("announcement.description")}</DialogDescription>
      <EditorForm />
    </DialogContent>
  </Dialog>;
}
