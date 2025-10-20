export type Theme = "system" | "light" | "sepia" | "dark" | "night" | "contrast" | "forest" | "ocean" | "sunset" | "lavender" | "mint" | "rose";

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
  forest: {
    bg: "20 28 15",
    card: "32 42 25",
    text: "230 240 225",
    muted: "140 155 135",
    border: "55 75 50",
    accent: "74 222 128",
  },
  ocean: {
    bg: "15 35 50",
    card: "25 50 70",
    text: "220 240 250",
    muted: "130 170 200",
    border: "45 85 120",
    accent: "34 197 238",
  },
  sunset: {
    bg: "45 25 15",
    card: "65 35 25",
    text: "255 240 220",
    muted: "180 130 100",
    border: "120 60 40",
    accent: "251 146 60",
  },
  lavender: {
    bg: "240 235 250",
    card: "250 245 255",
    text: "60 40 100",
    muted: "140 110 170",
    border: "220 200 240",
    accent: "168 85 247",
  },
  mint: {
    bg: "240 255 250",
    card: "245 255 252",
    text: "10 80 60",
    muted: "100 160 130",
    border: "200 240 220",
    accent: "16 185 129",
  },
  rose: {
    bg: "255 240 245",
    card: "255 245 250",
    text: "100 20 60",
    muted: "180 100 140",
    border: "235 200 220",
    accent: "244 63 94",
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