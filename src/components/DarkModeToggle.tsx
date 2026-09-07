"use client";

import { Moon, Sun, Monitor } from "@/components/Icones/Reicon";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Appearance } from "@/contexts/ThemeContext";

function AppearanceIcon({ appearance }: { appearance: Appearance }) {
  const Icon = appearance === "light" ? Sun : appearance === "dark" ? Moon : Monitor;

  return (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
      <Icon
        key={appearance}
        aria-hidden="true"
        className="absolute inset-0 size-4 semantic-icon-transition"
      />
    </span>
  );
}

export default function DarkModeToggle() {
  const { appearance, setAppearance } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
        <AppearanceIcon appearance="light" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
          <AppearanceIcon appearance={appearance} />
          <span className="sr-only">
            {t("theme.toggle", { defaultValue: "Toggle theme" })}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setAppearance("light")}
          role="menuitemradio"
          aria-checked={appearance === "light"}
          className={appearance === "light" ? "bg-accent" : ""}
        >
          <Sun
            aria-hidden="true"
            className={`mr-2 h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${appearance === "light" ? "scale-110" : ""}`}
          />
          <span>{t("theme.light", { defaultValue: "Light" })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setAppearance("dark")}
          role="menuitemradio"
          aria-checked={appearance === "dark"}
          className={appearance === "dark" ? "bg-accent" : ""}
        >
          <Moon
            aria-hidden="true"
            className={`mr-2 h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${appearance === "dark" ? "scale-110" : ""}`}
          />
          <span>{t("theme.dark", { defaultValue: "Dark" })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setAppearance("system")}
          role="menuitemradio"
          aria-checked={appearance === "system"}
          className={appearance === "system" ? "bg-accent" : ""}
        >
          <Monitor
            aria-hidden="true"
            className={`mr-2 h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${appearance === "system" ? "scale-110" : ""}`}
          />
          <span>{t("theme.system", { defaultValue: "System" })}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
