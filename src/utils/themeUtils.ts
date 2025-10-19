export type Theme = "system" | "light" | "sepia" | "dark" | "night" | "contrast";

export const THEME_COLORS: Record<Theme, Record<string, string>> = {
  light: {
    bg: "250 250 250",
    card: "255 255 255",
    text: "15 23 42",
    muted: "100 116 139",
    border: "226 232 240",
    accent: "59 130 246",
  },
  sepia: {
    bg: "251 245 233",
    card: "255 250 240",
    text: "55 45 35",
    muted: "110 95 80",
    border: "235 225 210",
    accent: "217 119 6",
  },
  dark: {
    bg: "15 23 42",
    card: "30 41 59",
    text: "241 245 249",
    muted: "148 163 184",
    border: "51 65 85",
    accent: "96 165 250",
  },
  night: {
    bg: "0 0 0",
    card: "12 12 12",
    text: "235 235 235",
    muted: "150 150 150",
    border: "38 38 38",
    accent: "99 102 241",
  },
  contrast: {
    bg: "255 255 255",
    card: "255 255 255",
    text: "0 0 0",
    muted: "20 20 20",
    border: "0 0 0",
    accent: "0 0 0",
  },
  system: {
    bg: "250 250 250",
    card: "255 255 255",
    text: "15 23 42",
    muted: "100 116 139",
    border: "226 232 240",
    accent: "59 130 246",
  },
};

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function getEffectiveTheme(theme: Theme): Exclude<Theme, "system"> {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  const effectiveTheme = getEffectiveTheme(theme);
  const colors = THEME_COLORS[effectiveTheme];

  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}