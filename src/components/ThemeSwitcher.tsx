"use client";
import { Moon, Sun, Palette, Eye, Contrast } from "lucide-react";
import { useThemeStore, type Theme } from "../store/themeStore";

const options: { label: string; value: Theme; icon: React.ReactNode }[] = [
  { label: "Light", value: "light", icon: <Sun className="w-4 h-4" /> },
  { label: "Sepia", value: "sepia", icon: <Palette className="w-4 h-4" /> },
  { label: "Dark", value: "dark", icon: <Moon className="w-4 h-4" /> },
  { label: "Night (OLED)", value: "night", icon: <Eye className="w-4 h-4" /> },
  { label: "High Contrast", value: "contrast", icon: <Contrast className="w-4 h-4" /> },
];

export default function ThemeSwitcher() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const currentOption = options.find((o) => o.value === theme);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text">Theme</span>
      <div className="relative inline-block">
        <select
          className="appearance-none cursor-pointer button rounded-lg border border-input bg-card px-3 py-2 pr-8 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1"
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground">
          {currentOption?.icon}
        </div>
      </div>
    </div>
  );
}