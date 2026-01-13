"use client";
import { useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import { applyTheme } from "../utils/themeUtils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  
  useEffect(() => {
    try {
      applyTheme(theme);
    } catch (error) {
      console.error("បរាជ័យក្នុងការដាក់ Theme:", error);
 
      applyTheme("light");
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {

      if (theme === "light" || theme === "dark") {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return <>{children}</>;
}