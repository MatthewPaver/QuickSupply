"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const modes = ["light", "dark", "system"] as const;

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const labels = {
  light: "Switch to dark mode",
  dark: "Switch to system mode",
  system: "Switch to light mode",
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch — render a placeholder until mounted
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Toggle theme" disabled>
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  const current = (modes.includes(theme as (typeof modes)[number]) ? theme : "system") as (typeof modes)[number];
  const nextIndex = (modes.indexOf(current) + 1) % modes.length;
  const next = modes[nextIndex];
  const Icon = icons[current];

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => setTheme(next)}
      aria-label={labels[current]}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
